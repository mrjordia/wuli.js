[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/ray-cast-hit](../README.md) / RayCastHit

# Class: RayCastHit

Defined in: [shape/ray-cast-hit.ts:8](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/ray-cast-hit.ts#L8)

射线检测命中结果类。
存储射线与几何体相交检测的核心结果数据，是物理引擎中射线检测的核心返回载体，
包含相交点坐标、相交面法向量、相交比例三个关键信息，适用于所有几何体（球体、圆柱体、地形等）的射线检测结果返回。

## Constructors

### Constructor

> **new RayCastHit**(): `RayCastHit`

#### Returns

`RayCastHit`

## Properties

### fraction

> **fraction**: `number` = `0`

Defined in: [shape/ray-cast-hit.ts:33](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/ray-cast-hit.ts#L33)

射线相交比例（0~1）。
核心意义：
1. 计算方式：fraction = 相交点到射线起点的距离 / 射线总长度；
2. 取值范围：0表示相交点在射线起点，1表示相交点在射线终点，>1表示相交点在射线延长线上（通常视为未相交）；
3. 用途：多物体射线检测时，可通过fraction筛选最近的相交对象。

***

### normal

> **normal**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [shape/ray-cast-hit.ts:24](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/ray-cast-hit.ts#L24)

相交点处几何体表面的法向量（归一化，长度为1）。
三维向量存储法向量的X/Y/Z分量：
- 法向量方向指向射线的反方向（外法线），用于碰撞响应、光照计算、反射/折射等场景；
- 该向量已归一化，可直接用于向量运算（如计算反射射线方向）。

***

### position

> **position**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [shape/ray-cast-hit.ts:16](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/ray-cast-hit.ts#L16)

射线与几何体的相交点坐标（世界/局部坐标系由射线检测方法决定）。
三维向量存储相交点的X/Y/Z坐标：
- 若调用的是local射线检测方法（如rayCastLocal），则为局部坐标系坐标；
- 若调用的是world射线检测方法，则为世界坐标系坐标；
该属性是射线检测最核心的结果，用于定位相交位置。
