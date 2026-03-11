[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [collision-detector/precise-ray-caster](../README.md) / PreciseRayCaster

# Class: PreciseRayCaster

Defined in: collision-detector/precise-ray-caster.ts:43

精确射线检测类
用于在物理世界中执行高精度的射线检测，能够精确检测到具体的形状表面
会先通过宽相位检测筛选候选对象，再对每个候选对象执行精确的几何相交检测

## Constructors

### Constructor

> **new PreciseRayCaster**(`world`): `PreciseRayCaster`

Defined in: collision-detector/precise-ray-caster.ts:61

构造精确射线检测器

#### Parameters

##### world

[`World`](../../../world/classes/World.md)

物理世界实例，用于获取宽相位检测能力

#### Returns

`PreciseRayCaster`

## Methods

### rayCast()

> **rayCast**(`start`, `end`): [`PreciseRayCastResult`](../interfaces/PreciseRayCastResult.md)

Defined in: collision-detector/precise-ray-caster.ts:126

执行精确射线检测

#### Parameters

##### start

射线起始点（世界坐标系）

###### x

`number`

###### y

`number`

###### z

`number`

##### end

射线结束点（世界坐标系）

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

[`PreciseRayCastResult`](../interfaces/PreciseRayCastResult.md)

精确的射线检测结果，包含最近命中的物体信息
