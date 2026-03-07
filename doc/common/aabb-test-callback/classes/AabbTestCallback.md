[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [common/aabb-test-callback](../README.md) / AabbTestCallback

# Abstract Class: AabbTestCallback

Defined in: [common/aabb-test-callback.ts:7](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/aabb-test-callback.ts#L7)

AABB包围盒检测回调抽象类。
用于物理引擎中AABB重叠检测的回调处理，定义了检测到相交Shape时的统一处理接口

## Constructors

### Constructor

> **new AabbTestCallback**(): `AabbTestCallback`

#### Returns

`AabbTestCallback`

## Methods

### process()

> `abstract` **process**(`shape`): `void`

Defined in: [common/aabb-test-callback.ts:15](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/common/aabb-test-callback.ts#L15)

AABB检测到相交Shape时的回调处理方法（抽象方法，必须实现）。
每次检测到一个Shape与查询范围的AABB相交时，该方法会被调用

#### Parameters

##### shape

[`Shape`](../../../shape/shape/classes/Shape.md)

与查询AABB相交的Shape实例

#### Returns

`void`
