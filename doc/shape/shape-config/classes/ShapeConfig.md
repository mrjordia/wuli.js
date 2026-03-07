[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [shape/shape-config](../README.md) / ShapeConfig

# Class: ShapeConfig

Defined in: [shape/shape-config.ts:75](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape-config.ts#L75)

碰撞体配置类。
物理引擎中碰撞体的核心配置类，封装碰撞体的几何形状、物理属性、碰撞规则和回调逻辑，
是创建碰撞体（Shape）的核心入参，支持动态配置不同物理特性的碰撞体（如刚体、静态体、传感器）。

## Constructors

### Constructor

> **new ShapeConfig**(`optional`): `ShapeConfig`

Defined in: [shape/shape-config.ts:148](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape-config.ts#L148)

构造函数：创建碰撞体配置实例。
核心逻辑：
1. 必选参数校验：确保geometry已配置（几何体是碰撞体的核心）；
2. 地形特殊处理：地形几何体忽略position/rotation配置（静态地形位置由全局变换控制）；
3. 默认值填充：未配置的物理属性/碰撞规则使用引擎常量默认值；
4. 数据转换：将四元数旋转转换为3x3旋转矩阵，适配物理引擎的旋转表示。

#### Parameters

##### optional

[`IShapeConfigOptions`](../interfaces/IShapeConfigOptions.md)

碰撞体配置项（geometry为必选，其余可选）

#### Returns

`ShapeConfig`

## Properties

### collisionGroup

> **collisionGroup**: `number`

Defined in: [shape/shape-config.ts:116](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape-config.ts#L116)

碰撞组。
碰撞体所属的分组标识，默认值为CONSTANT.SETTING_DEFAULT_COLLISION_GROUP；
用于碰撞过滤，仅与collisionMask匹配的碰撞体进行碰撞检测。

***

### collisionMask

> **collisionMask**: `number`

Defined in: [shape/shape-config.ts:123](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape-config.ts#L123)

碰撞掩码。
碰撞体的碰撞检测目标掩码，默认值为CONSTANT.SETTING_DEFAULT_COLLISION_MASK；
与collisionGroup配合实现精细化碰撞控制（如玩家不与友方单位碰撞）。

***

### contactCallback

> **contactCallback**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`ContactCallback`](../../../common/contact-callback/classes/ContactCallback.md)\>

Defined in: [shape/shape-config.ts:137](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape-config.ts#L137)

碰撞接触回调函数。
自定义碰撞接触回调，默认值为null（无回调）；
可在碰撞发生时执行自定义逻辑，如检测到与地面接触时播放脚步声。

***

### density

> **density**: `number`

Defined in: [shape/shape-config.ts:109](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape-config.ts#L109)

密度。
碰撞体的密度值，默认值为CONSTANT.SETTING_DEFAULT_DENSITY；
结合几何体体积计算总质量（mass = density × volume），静态几何体无质量。

***

### friction

> **friction**: `number`

Defined in: [shape/shape-config.ts:95](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape-config.ts#L95)

摩擦系数。
碰撞体表面摩擦系数，默认值为CONSTANT.SETTING_DEFAULT_FRICTION；
影响碰撞体接触时的滑动行为，如物体在斜面上是否会下滑。

***

### geometry

> **geometry**: [`Geometry`](../../geometry/classes/Geometry.md)

Defined in: [shape/shape-config.ts:130](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape-config.ts#L130)

碰撞体的几何形状定义。
关联的几何体实例，决定碰撞体的形状和碰撞检测算法；
支持SphereGeometry、TerrainGeometry等所有Geometry子类。

***

### position

> **position**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [shape/shape-config.ts:81](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape-config.ts#L81)

碰撞体局部位置。
碰撞体相对于父物体的局部位置，地形几何体默认忽略该属性（位置由变换矩阵控制）；
初始值为Vec3(0,0,0)，可通过配置项position覆盖。

***

### restitution

> **restitution**: `number`

Defined in: [shape/shape-config.ts:102](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape-config.ts#L102)

恢复系数（弹性）。
碰撞体的弹性系数，默认值为CONSTANT.SETTING_DEFAULT_RESTITUTION；
决定碰撞后的反弹力度，如钢球比皮球的恢复系数更高。

***

### rotation

> **rotation**: [`Mat3`](../../../common/mat3/classes/Mat3.md)

Defined in: [shape/shape-config.ts:88](https://github.com/mrjordia/wuli.js/blob/7de21a82143fc3ac3a292a682132d8c92838c4a4/src/shape/shape-config.ts#L88)

碰撞体局部旋转矩阵（3x3）。
碰撞体相对于父物体的局部旋转，由四元数转换而来，地形几何体默认忽略该属性；
初始值为单位矩阵（无旋转），可通过配置项rotation覆盖。
