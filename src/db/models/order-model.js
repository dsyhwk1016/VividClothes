import { model } from 'mongoose';
import { OrderSchema } from '../schemas/order-schema';

const Order = model('orders', OrderSchema);

export class OrderModel {
    // 주문 추가
    async create(orderInfo) {
        const createdNewOrder = await Order.create(orderInfo);
        return createdNewOrder;
    }

    // 모든 주문 조회
    async findAll() {
        const orders = await Order.find({});
        return orders;
    }

    // 유저별 주문 조회
    async findByUser(userId) {
        const orders = await Order.find({ orderer: userId });
        return orders;
    }

    // objectId를 이용해 특정 주문 조회
    async findById(orderId) {
        const order = await Order.findOne({ _id: orderId });
        return order;
    }
    
    // 주문 취소 - 삭제
    async delete(orderId) {
        const filter = { _id: orderId };
        
        const deleteedOrder = await Order.findOneAndDelete(filter);
        return deleteedOrder;
    }
}

const orderModel = new OrderModel();

export { orderModel };