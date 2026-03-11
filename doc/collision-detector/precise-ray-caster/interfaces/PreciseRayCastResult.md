[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [collision-detector/precise-ray-caster](../README.md) / PreciseRayCastResult

# Interface: PreciseRayCastResult

Defined in: collision-detector/precise-ray-caster.ts:13

精确射线检测结果接口
包含射线是否命中、命中的形状、刚体、命中点坐标和法向量等信息

## Properties

### hit

> **hit**: `boolean`

Defined in: collision-detector/precise-ray-caster.ts:15

是否命中物体

***

### hitNormal

> **hitNormal**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: collision-detector/precise-ray-caster.ts:23

世界坐标系下的命中点法向量

***

### hitPoint

> **hitPoint**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: collision-detector/precise-ray-caster.ts:21

世界坐标系下的命中点坐标

***

### rigidBody

> **rigidBody**: [`RigidBody`](../../../rigid-body/rigid-body/classes/RigidBody.md) \| `null`

Defined in: collision-detector/precise-ray-caster.ts:19

命中的刚体对象，未命中则为 null

***

### shape

> **shape**: [`Shape`](../../../shape/shape/classes/Shape.md) \| `null`

Defined in: collision-detector/precise-ray-caster.ts:17

命中的形状对象，未命中则为 null
