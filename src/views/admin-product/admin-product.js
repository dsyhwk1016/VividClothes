// APIs
import * as Api from '/api.js';

// Utils
import { addComponentEvents } from '/components-event.js';

// Components
import { header, addHeaderEventListener } from '/header/header.js';
import category from '/category/category.js';
import layout from '/layout/layout.js';
import titleSection from '/layout/title-section.js';
import productGrid from '/products/products-grid.js';
import modal from '/modal/modal.js';
import productModalForm from '/modal/product-modal-form.js';

class AdminProduct {
  constructor() {
    // Base DOM
    this.root = document.getElementById('root');
    this.main = document.getElementById('main');

    // Components
    this.header = document.getElementById('header');
    this.category = document.getElementById('category');
    this.addProductModal = document.getElementById('add-product-modal');
    this.editProductModal = document.getElementById('edit-product-modal');
    this.layout = document.getElementById('layout');
    this.titleSection = document.getElementById('title-section');
    this.productGrid = document.getElementById('products-grid');
  }

  async createDOM() {
    this.header.insertAdjacentElement('afterbegin', header);
    this.layout.insertAdjacentHTML('afterbegin', layout());

    const categories = await Api.get('/category/list');
    this.category.insertAdjacentHTML('afterbegin', await category({ categories }));

    this.titleSection.insertAdjacentHTML(
      'afterbegin',
      titleSection({
        title: '관리자 설정',
        subTitle: '상품 관리',
        extraContent: () => this.createTitleSectionLeft(categories),
      })
    );

    this.productGrid.insertAdjacentHTML('afterbegin', await productGrid());

    this.addProductModal.insertAdjacentHTML(
      'afterbegin',
      modal({ modalForm: productModalForm, type: 'ADD', categories })
    );

    this.editProductModal.insertAdjacentHTML(
      'afterbegin',
      modal({ modalForm: productModalForm, type: 'EDIT', categories })
    );
  }

  addAllEvents() {
    // addComponentEvents(this.header);
    addHeaderEventListener();
    addComponentEvents(this.category);
    addComponentEvents(this.titleSection);
    addComponentEvents(this.addProductModal);
    addComponentEvents(this.editProductModal);

    this.addSelectCategoryEvent();
    this.addCreateProductEvent();
    this.addEditProductEvent();
    this.addDeleteProductEvent();
  }

  createTitleSectionLeft(categories) {
    return /* html */ `
      <div class="select">
        <select class="select-box">
          <option value="default">전체</option>
            ${categories
              .map(({ categoryName }) => {
                return /* html */ ` 
                <option value=${categoryName}>${categoryName}</option>
              `;
              })
              .join()}
        </select>
      </div>
      <button class="add-product-btn"><i class="fa-solid fa-plus"></i></button>
    `;
  }

  addSelectCategoryEvent() {
    const selectBox = this.titleSection.querySelector('.select-box');

    selectBox.addEventListener('change', async () => {
      console.log(selectBox.value);
      this.productGrid.innerHTML = await productGrid({ selected: selectBox.value });
    });
  }

  addCreateProductEvent() {
    const createProductBtn = this.titleSection.querySelector('.add-product-btn');
    createProductBtn.addEventListener('click', () => {
      this.addProductModal.querySelector('.add-product-form').classList.add('show-modal');
    });
  }

  addEditProductEvent() {
    const editProductBtns = this.productGrid.querySelectorAll('.edit-product-btn');

    editProductBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const { _id, productName, category, price, imagePath, info, option } = await Api.get(
          `/product/${btn.dataset.id}`
        );
        const editModalForm = this.editProductModal.querySelector('.edit-product-form');
        this.editProductModal.setAttribute('product-id', _id.toString());

        editModalForm.querySelector('.modal-input[id=product-name]').value = productName;
        editModalForm.querySelector('.modal-input[id=product-info]').value = info;
        editModalForm.querySelector('.modal-input[id=product-price]').value = price;
        if (category) {
          editModalForm.querySelector('.select-category').value = category.categoryName;
        }

        const sizeInputs = editModalForm.querySelectorAll('.size-radio-input');
        Array.from(sizeInputs).forEach((sizeInput) => {
          if (option.size.includes(sizeInput.name)) {
            sizeInput.checked = true;
          } else {
            sizeInput.checked = false;
          }
        });

        editModalForm.classList.add('show-modal');
      });
    });
  }

  addDeleteProductEvent() {
    const deleteProductBtns = this.productGrid.querySelectorAll('.delete-product-btn');

    deleteProductBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (confirm('해당 상품을 정말 삭제하시겠습니까?')) {
          console.log(btn.dataset.id);
          await Api.delete(`/product/delete/${btn.dataset.id}`);
          window.location.reload();
        }
      });
    });
  }

  async render() {
    await this.createDOM();
    this.addAllEvents();
  }
}

window.onload = () => {
  const adminProduct = new AdminProduct();
  adminProduct.render();
};
