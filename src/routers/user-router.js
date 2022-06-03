import { Router } from 'express';

import { userService } from '../services';
import { checkBody, loginRequired, userRoleCheck } from '../middlewares';
import * as userValidator from '../middlewares/user-validator';
import generateRandomPassword from '../util/generate-random-password';
import passport from 'passport';
// import { Strategy as KakaoStrategy } from 'passport-kakao';
// import { UserSchema } from '../db/schemas/user-schema';
import verify from '../services/google-passport';

const userRouter = Router();

// 회원가입 api (아래는 /register이지만, 실제로는 /api/register로 요청해야 함.)
userRouter.post('/register', checkBody, userValidator.validateSignup, async (req, res, next) => {
  try {
    // req (request)의 body 에서 데이터 가져오기
    const fullName = req.body.fullName;
    const email = req.body.email;
    const password = req.body.password;

    // 위 데이터를 유저 db에 추가하기
    await userService.addUser({
      fullName,
      email,
      password,
    });
    const { token, userRole, hashedEmail } = await userService.getUserToken({
      email,
      password,
    });
    // 추가된 유저의 db 데이터를 프론트에 다시 보내줌
    // 물론 프론트에서 안 쓸 수도 있지만, 편의상 일단 보내 줌
    res.status(201).json({ token, userRole, hashedEmail });
  } catch (error) {
    next(error);
  }
});

// 로그인 api (아래는 /login 이지만, 실제로는 /api/login로 요청해야 함.)
userRouter.post(
  '/login',
  checkBody,
  userValidator.validateCredential,
  async function (req, res, next) {
    try {
      // req (request) 에서 데이터 가져오기
      const email = req.body.email;
      const password = req.body.password;

      // 로그인 진행 (로그인 성공 시 jwt 토큰을 프론트에 보내 줌)
      const { token, userRole, hashedEmail } = await userService.getUserToken({
        email,
        password,
      });

      // jwt 토큰을 프론트에 보냄 (jwt 토큰은, 문자열임)
      res.status(200).json({ token, userRole, hashedEmail });
    } catch (error) {
      next(error);
    }
  }
);

// 전체 유저 목록을 가져옴 (배열 형태임)
// 미들웨어로 loginRequired 를 썼음 (이로써, jwt 토큰이 없으면 사용 불가한 라우팅이 됨)
userRouter.get('/userlist', loginRequired, userRoleCheck, async function (req, res, next) {
  try {
    // 전체 사용자 목록을 얻음
    const users = await userService.getUsers();

    // 사용자 목록(배열)을 JSON 형태로 프론트에 보냄
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

//특정 유저
userRouter.get('/user', loginRequired, async (req, res, next) => {
  try {
    // req의 params에서 데이터 가져옴
    const userId = req.currentUserId;
    const user = await userService.getUserById(userId);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

// 사용자 정보 수정
// (예를 들어 /api/users/abc12345 로 요청하면 req.params.userId는 'abc12345' 문자열로 됨)
userRouter.patch('/users', checkBody, loginRequired, async function (req, res, next) {
  try {
    // params로부터 id를 가져옴
    const userId = req.currentUserId;

    // body data 로부터 업데이트할 사용자 정보를 추출함.
    const fullName = req.body.fullName;
    const address = req.body.address;
    const phoneNumber = req.body.phoneNumber;

    // body data로부터, 확인용으로 사용할 현재 비밀번호를 추출함.
    const currentPassword = req.body.currentPassword;

    // currentPassword 없을 시, 진행 불가
    if (!currentPassword) {
      throw new Error('정보를 변경하려면, 현재의 비밀번호가 필요합니다.');
    }

    const userInfoRequired = { userId, currentPassword };

    // 위 데이터가 undefined가 아니라면, 즉, 프론트에서 업데이트를 위해
    // 보내주었다면, 업데이트용 객체에 삽입함.
    const toUpdate = {
      ...(fullName && { fullName }),
      ...(address && { address }),
      ...(phoneNumber && { phoneNumber }),
    };
    // 사용자 정보를 업데이트함.
    const updatedUserInfo = await userService.setUser(userInfoRequired, toUpdate);

    // 업데이트 이후의 유저 데이터를 프론트에 보내 줌
    res.status(200).json(updatedUserInfo);
  } catch (error) {
    next(error);
  }
});
// 사용자 정보 삭제 사용자는 개인 페이지에서 자신의 회원 정보를 삭제(탈퇴)할 수 있다.
userRouter.delete('/user', loginRequired, async (req, res, next) => {
  try {
    const currentPassword = req.body.currentPassword;

    // currentPassword 없을 시, 진행 불가
    if (!currentPassword) {
      throw new Error('정보를 변경하려면, 현재의 비밀번호가 필요합니다.');
    }

    const userId = req.currentUserId;
    const userInfoRequired = { userId, currentPassword };

    if (!userId) {
      return res.status(400);
    }
    await userService.deleteUser(userInfoRequired);
    res.status(204).json({ message: '해당 유저는 없습니다.' }); //no content
  } catch (error) {
    next(error);
  }
});

//
userRouter.get('/google', passport.authenticate('google', { scope: ['profile'] }));

userRouter.get(
  '/google/login',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);
//비밀번호 찾기
userRouter.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  if (email == '') {
    res.status(400).send('email required');
  }
  // 해당 email이 있는지 확인
  const userInfo = await userService.getUserByEmail(email);
  const passwordToken = generateRandomPassword();
  console.log(userInfo); //userinfo 값 먼저 확인해보고
  // 밑에 email에 어떻게 넣을지 생각해보기 uiserInfo.email??
  const data = {
    passwordToken,
    email: userInfo.email,
    ttl: 300, //ttl 값 설정 (5분)
  };
  // 5. 인증 코드 테이블에 데이터 입력
  // 예) db.EmailAuth.create(data);
  userService.createAuth(data);
});
export { userRouter };
