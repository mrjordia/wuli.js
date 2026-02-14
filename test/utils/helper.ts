import { expect } from '@jest/globals';

export const EPSILON = 1e-9;

export const expectNumbersToBeClose = (actual: number, expected: number, message?: string) => {
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(EPSILON);
};

export const expectF64ToBeClose = (tar: Float64Array, expectedElements: number[], message?: string) => {
    expect(tar.length).toBe(expectedElements.length);
    for (let i = 0; i < expectedElements.length; i++) {
        expectNumbersToBeClose(tar[i], expectedElements[i], `${message} (元素索引 ${i})`);
    }
};

export const expectElementsToBeClose = (tar: { elements: Float64Array }, expectedElements: number[], message?: string) => {
    expectF64ToBeClose(tar.elements, expectedElements, message);
};