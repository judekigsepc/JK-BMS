import Joi from 'joi';

export const validateIfNumber = (value: any, errMsg: string): void => {
    const schema = Joi.number().required();
    const { error } = schema.validate(value);
    if (error) {
        throw new Error(errMsg);
    }
};

export const validateIfString = (value: any, errMsg: string): void => {
    const schema = Joi.string().required();
    const { error } = schema.validate(value);
    if (error) {
        throw new Error(errMsg);
    }
};

export const validateIfEmail = (value: any, errMsg: string): void => {
    const schema = Joi.string().email().required();
    const { error } = schema.validate(value);
    if (error) {
        throw new Error(errMsg);
    }
};

export const validateMultipleStrings = (values: any[], errMsg: string): void => {
    if (!Array.isArray(values)) {
        throw new Error('The input should be an array');
    }
    values.forEach(value => {
        const schema = Joi.string().required();
        const { error } = schema.validate(value);
        if (error) {
            throw new Error(errMsg);
        }
    });
};

export const validateMultipleNumbers = (values: any[], errMsg: string): void => {
    if (!Array.isArray(values)) {
        throw new Error('The input should be an array');
    }

    values.forEach(value => {
        const schema = Joi.number().required();
        const { error } = schema.validate(value);
        if (error) {
            throw new Error(errMsg);
        }
    })
}