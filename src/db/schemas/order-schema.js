import { Schema } from 'mongoose';

const OrderSchema = new Schema(
    {
        orderer: {
            type: Schema.Types.ObjectId,
            ref: 'userModel',
            required: true,
        },
        productId: {
            type: [Schema.Types.ObjectId],
            ref: 'categoryModel',
            required: true,
        },
        priceTotal: {
            type: Number,
            required: true,
        },
        address: {
            type: new Schema({
                postalCode: String,
                address1: String,
                address2: String
            },
            {
                _id: false,
            }),
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        option: {
            type: String,
            required: false,
        },
    },
    {
        collection: 'orders',
        timestamps: true,
    }
);

export { OrderSchema };