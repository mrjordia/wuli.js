[**wuli.js API文档**](../../../README.md)

***

[wuli.js API文档](../../../modules.md) / [rigid-body/rigid-body](../README.md) / RigidBody

# Class: RigidBody

Defined in: [rigid-body/rigid-body.ts:33](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L33)

刚体类，是物理引擎的核心对象，负责管理物体的物理属性、运动状态和碰撞形状。
支持静态(STATIC)、动态(DYNAMIC)、运动学(KINEMATIC)三种刚体类型，提供完整的物理交互能力

## Constructors

### Constructor

> **new RigidBody**(`config`): `RigidBody`

Defined in: [rigid-body/rigid-body.ts:115](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L115)

构造函数，创建刚体实例

#### Parameters

##### config

[`RigidBodyConfig`](../../rigid-body-config/classes/RigidBodyConfig.md)

刚体配置对象

#### Returns

`RigidBody`

## Properties

### addedToIsland

> **addedToIsland**: `boolean` = `false`

Defined in: [rigid-body/rigid-body.ts:83](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L83)

是否已添加到物理岛，用于优化碰撞检测

***

### angPseudoVel

> **angPseudoVel**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [rigid-body/rigid-body.ts:93](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L93)

伪角速度，用于约束求解阶段的旋转修正

***

### angularContactImpulse

> **angularContactImpulse**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [rigid-body/rigid-body.ts:101](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L101)

接触产生的角冲量累计值，用于物理调试

***

### angVel

> **angVel**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [rigid-body/rigid-body.ts:89](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L89)

角速度 (rad/s)，存储在Float64Array[3]中 [x, y, z]

***

### contactLinkList

> **contactLinkList**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`ContactLink`](../../../constraint/contact/contact-link/classes/ContactLink.md)\>

Defined in: [rigid-body/rigid-body.ts:67](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L67)

接触链接链表头节点，管理当前刚体的所有接触约束

***

### contactLinkListLast

> **contactLinkListLast**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`ContactLink`](../../../constraint/contact/contact-link/classes/ContactLink.md)\>

Defined in: [rigid-body/rigid-body.ts:69](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L69)

接触链接链表最后一个节点

***

### force

> **force**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [rigid-body/rigid-body.ts:95](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L95)

作用在刚体上的合外力 (N)，存储在Float64Array[3]中 [x, y, z]

***

### invInertia

> **invInertia**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [rigid-body/rigid-body.ts:109](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L109)

世界空间逆转动惯量矩阵（3x3），行优先存储

***

### invLocalInertia

> **invLocalInertia**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [rigid-body/rigid-body.ts:105](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L105)

本地逆转动惯量矩阵（3x3），行优先存储

***

### invLocalInertiaWithoutRotFactor

> **invLocalInertiaWithoutRotFactor**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [rigid-body/rigid-body.ts:107](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L107)

未应用旋转因子的本地逆转动惯量矩阵，用于旋转因子修改时快速计算

***

### jointLinkList

> **jointLinkList**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`JointLink`](../../../constraint/joint/joint-link/classes/JointLink.md)\>

Defined in: [rigid-body/rigid-body.ts:73](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L73)

关节链接链表头节点，管理当前刚体的所有关节约束

***

### jointLinkListLast

> **jointLinkListLast**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`JointLink`](../../../constraint/joint/joint-link/classes/JointLink.md)\>

Defined in: [rigid-body/rigid-body.ts:75](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L75)

关节链接链表最后一个节点

***

### linearContactImpulse

> **linearContactImpulse**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [rigid-body/rigid-body.ts:99](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L99)

接触产生的线性冲量累计值，用于物理调试

***

### localInertia

> **localInertia**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [rigid-body/rigid-body.ts:103](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L103)

本地转动惯量矩阵（3x3），行优先存储

***

### name

> `readonly` **name**: `string`

Defined in: [rigid-body/rigid-body.ts:61](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L61)

刚体名称，用于调试和标识

***

### next

> **next**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<`RigidBody`\>

Defined in: [rigid-body/rigid-body.ts:63](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L63)

链表下一个刚体的引用，用于物理世界的刚体管理

***

### numContactLinks

> **numContactLinks**: `number` = `0`

Defined in: [rigid-body/rigid-body.ts:71](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L71)

接触链接的数量

***

### numJointLinks

> **numJointLinks**: `number` = `0`

Defined in: [rigid-body/rigid-body.ts:77](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L77)

关节链接的数量

***

### object3Ds

> **object3Ds**: [`IObject3D`](../interfaces/IObject3D.md)[] = `[]`

Defined in: [rigid-body/rigid-body.ts:59](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L59)

关联的3D渲染对象列表，用于同步物理状态到渲染引擎

***

### prev

> **prev**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<`RigidBody`\>

Defined in: [rigid-body/rigid-body.ts:65](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L65)

链表上一个刚体的引用，用于物理世界的刚体管理

***

### pseudoVel

> **pseudoVel**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [rigid-body/rigid-body.ts:91](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L91)

伪线性速度，用于约束求解阶段的位置修正

***

### rotFactor

> **rotFactor**: [`Vec3`](../../../common/vec3/classes/Vec3.md)

Defined in: [rigid-body/rigid-body.ts:57](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L57)

旋转因子，用于缩放各轴的转动惯量。
可用于限制特定轴的旋转（设为0）或调整旋转难易程度

***

### sleeping

> **sleeping**: `boolean` = `false`

Defined in: [rigid-body/rigid-body.ts:81](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L81)

是否处于休眠状态，休眠的刚体不参与物理计算

***

### sleepTime

> **sleepTime**: `number` = `0`

Defined in: [rigid-body/rigid-body.ts:79](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L79)

休眠计时，达到阈值后进入休眠状态

***

### torque

> **torque**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [rigid-body/rigid-body.ts:97](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L97)

作用在刚体上的合外力矩 (N·m)，存储在Float64Array[3]中 [x, y, z]

***

### vel

> **vel**: `Float64Array`\<`ArrayBuffer`\>

Defined in: [rigid-body/rigid-body.ts:87](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L87)

线性速度 (m/s)，存储在Float64Array[3]中 [x, y, z]

***

### world

> **world**: [`Nullable`](../../../common/nullable/type-aliases/Nullable.md)\<[`World`](../../../world/classes/World.md)\>

Defined in: [rigid-body/rigid-body.ts:85](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L85)

所属的物理世界引用

## Accessors

### angularDamping

#### Get Signature

> **get** **angularDamping**(): `number`

Defined in: [rigid-body/rigid-body.ts:175](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L175)

获取角阻尼系数

##### Returns

`number`

角阻尼系数

***

### autoSleep

#### Get Signature

> **get** **autoSleep**(): `boolean`

Defined in: [rigid-body/rigid-body.ts:133](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L133)

获取是否启用自动休眠

##### Returns

`boolean`

自动休眠状态

#### Set Signature

> **set** **autoSleep**(`autoSleepEnabled`): `void`

Defined in: [rigid-body/rigid-body.ts:141](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L141)

设置自动休眠状态，修改后会立即唤醒刚体

##### Parameters

###### autoSleepEnabled

`boolean`

是否启用自动休眠

##### Returns

`void`

***

### gravityScale

#### Get Signature

> **get** **gravityScale**(): `number`

Defined in: [rigid-body/rigid-body.ts:215](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L215)

获取重力缩放因子

##### Returns

`number`

重力缩放因子

#### Set Signature

> **set** **gravityScale**(`gravityScale`): `void`

Defined in: [rigid-body/rigid-body.ts:223](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L223)

设置重力缩放因子，修改后会立即唤醒刚体

##### Parameters

###### gravityScale

`number`

重力缩放因子（默认1）

##### Returns

`void`

***

### invMass

#### Get Signature

> **get** **invMass**(): `number`

Defined in: [rigid-body/rigid-body.ts:151](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L151)

获取质量的倒数

##### Returns

`number`

质量倒数

***

### linearDamping

#### Get Signature

> **get** **linearDamping**(): `number`

Defined in: [rigid-body/rigid-body.ts:159](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L159)

获取线性阻尼系数

##### Returns

`number`

线性阻尼系数

#### Set Signature

> **set** **linearDamping**(`damping`): `void`

Defined in: [rigid-body/rigid-body.ts:167](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L167)

设置线性阻尼系数

##### Parameters

###### damping

`number`

线性阻尼系数（建议值：0~1）

##### Returns

`void`

***

### mass

#### Get Signature

> **get** **mass**(): `number`

Defined in: [rigid-body/rigid-body.ts:207](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L207)

获取刚体质量

##### Returns

`number`

质量（kg）

***

### ptransform

#### Get Signature

> **get** **ptransform**(): [`Transform`](../../../common/transform/classes/Transform.md)

Defined in: [rigid-body/rigid-body.ts:191](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L191)

获取上一帧的变换矩阵

##### Returns

[`Transform`](../../../common/transform/classes/Transform.md)

上一帧变换矩阵

***

### shapeList

#### Get Signature

> **get** **shapeList**(): [`Shape`](../../../shape/shape/classes/Shape.md)

Defined in: [rigid-body/rigid-body.ts:183](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L183)

获取形状链表头节点

##### Returns

[`Shape`](../../../shape/shape/classes/Shape.md)

形状链表头节点

***

### transform

#### Get Signature

> **get** **transform**(): [`Transform`](../../../common/transform/classes/Transform.md)

Defined in: [rigid-body/rigid-body.ts:199](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L199)

获取当前帧的变换矩阵

##### Returns

[`Transform`](../../../common/transform/classes/Transform.md)

当前帧变换矩阵

***

### type

#### Get Signature

> **get** **type**(): [`RIGID_BODY_TYPE`](../../../constant/enumerations/RIGID_BODY_TYPE.md)

Defined in: [rigid-body/rigid-body.ts:233](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L233)

获取刚体类型（地形刚体始终返回STATIC）

##### Returns

[`RIGID_BODY_TYPE`](../../../constant/enumerations/RIGID_BODY_TYPE.md)

刚体类型

#### Set Signature

> **set** **type**(`type`): `void`

Defined in: [rigid-body/rigid-body.ts:242](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L242)

设置刚体类型，地形刚体不允许修改类型

##### Throws

地形刚体修改类型时抛出错误

##### Parameters

###### type

[`RIGID_BODY_TYPE`](../../../constant/enumerations/RIGID_BODY_TYPE.md)

刚体类型

##### Returns

`void`

## Methods

### addAngularVelocity()

> **addAngularVelocity**(`angularVelocityChange`): `void`

Defined in: [rigid-body/rigid-body.ts:816](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L816)

添加角速度增量。
静态刚体不会产生任何变化

#### Parameters

##### angularVelocityChange

角速度增量

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### addLinearVelocity()

> **addLinearVelocity**(`linearVelocityChange`): `void`

Defined in: [rigid-body/rigid-body.ts:801](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L801)

添加线性速度增量。
静态刚体不会产生任何变化

#### Parameters

##### linearVelocityChange

速度增量

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### addObject3D()

> **addObject3D**(...`object3Ds`): `void`

Defined in: [rigid-body/rigid-body.ts:435](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L435)

添加3D渲染对象关联，用于同步物理状态到渲染引擎。
关联后会在object3Ds的userData中存储刚体引用，避免重复关联

#### Parameters

##### object3Ds

...[`IObject3D`](../interfaces/IObject3D.md)[]

要关联的3D对象

#### Returns

`void`

***

### addShape()

> **addShape**(`shape`): `void`

Defined in: [rigid-body/rigid-body.ts:258](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L258)

向刚体添加碰撞形状。
1. 地形形状只能添加一个，且会自动将刚体设为静态
2. 添加形状后会自动更新刚体质量和形状列表
3. 如果刚体已加入物理世界，会创建碰撞代理

#### Parameters

##### shape

[`Shape`](../../../shape/shape/classes/Shape.md)

要添加的形状

#### Returns

`void`

#### Throws

地形刚体添加多个形状时抛出错误

***

### applyAngularImpulse()

> **applyAngularImpulse**(`_impulse`): `void`

Defined in: [rigid-body/rigid-body.ts:867](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L867)

应用角冲量到刚体。
仅改变角速度：Δω = I⁻¹ × J

#### Parameters

##### \_impulse

角冲量向量 (kg·m²/s)

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### applyForce()

> **applyForce**(`_force`, `_positionInWorld`): `void`

Defined in: [rigid-body/rigid-body.ts:884](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L884)

应用力到刚体指定位置。
1. 力会累加到刚体的合外力中
2. 力会产生力矩，累加到合外力矩中：τ = r × F
3. 力的效果会在物理步进时体现（F = ma）

#### Parameters

##### \_force

力向量 (N)

###### x

`number`

###### y

`number`

###### z

`number`

##### \_positionInWorld

世界空间中的作用点

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### applyForceToCenter()

> **applyForceToCenter**(`_force`): `void`

Defined in: [rigid-body/rigid-body.ts:903](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L903)

应用力到刚体质心。
仅累加到合外力，不会产生力矩

#### Parameters

##### \_force

力向量 (N)

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### applyImpulse()

> **applyImpulse**(`_impulse`, `_positionInWorld`): `void`

Defined in: [rigid-body/rigid-body.ts:834](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L834)

应用冲量到刚体指定位置。
1. 冲量会改变线性速度：Δv = J/m
2. 冲量会产生力矩，改变角速度：Δω = I⁻¹ × (r × J)
3. r是作用点到质心的向量

#### Parameters

##### \_impulse

冲量向量 (N·s)

###### x

`number`

###### y

`number`

###### z

`number`

##### \_positionInWorld

世界空间中的作用点

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### applyLinearImpulse()

> **applyLinearImpulse**(`_impulse`): `void`

Defined in: [rigid-body/rigid-body.ts:853](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L853)

应用线性冲量到刚体质心。
仅改变线性速度：Δv = J/m

#### Parameters

##### \_impulse

冲量向量 (N·s)

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### applyTorque()

> **applyTorque**(`_torque`): `void`

Defined in: [rigid-body/rigid-body.ts:916](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L916)

应用力矩到刚体。
仅累加到合外力矩中

#### Parameters

##### \_torque

力矩向量 (N·m)

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### clearObject3D()

> **clearObject3D**(): `void`

Defined in: [rigid-body/rigid-body.ts:462](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L462)

清空所有关联的3D渲染对象

#### Returns

`void`

***

### getAngularContactImpulseTo()

> **getAngularContactImpulseTo**(`angularContactImpulse`): `void`

Defined in: [rigid-body/rigid-body.ts:937](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L937)

获取接触产生的角冲量累计值并写入目标对象。

#### Parameters

##### angularContactImpulse

目标角冲量对象

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### getAngularVelocityTo()

> **getAngularVelocityTo**(`angularVelocity`): `void`

Defined in: [rigid-body/rigid-body.ts:775](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L775)

获取角速度并写入目标对象

#### Parameters

##### angularVelocity

目标角速度对象

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### getLinearContactImpulseTo()

> **getLinearContactImpulseTo**(`linearContactImpulse`): `void`

Defined in: [rigid-body/rigid-body.ts:928](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L928)

获取接触产生的线性冲量累计值并写入目标对象。

#### Parameters

##### linearContactImpulse

目标冲量对象

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### getLinearVelocityTo()

> **getLinearVelocityTo**(`linearVelocity`): `object`

Defined in: [rigid-body/rigid-body.ts:750](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L750)

获取线性速度并写入目标对象

#### Parameters

##### linearVelocity

目标速度对象

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`object`

填充后的速度对象

##### x

> **x**: `number`

##### y

> **y**: `number`

##### z

> **z**: `number`

***

### getLocalInertiaTo()

> **getLocalInertiaTo**(`inertia`): `void`

Defined in: [rigid-body/rigid-body.ts:698](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L698)

获取本地转动惯量矩阵并写入目标对象

#### Parameters

##### inertia

目标矩阵对象

###### elements

`number`[] \| `Float64Array`\<`ArrayBufferLike`\>

#### Returns

`void`

***

### getLocalPointTo()

> **getLocalPointTo**(`worldPoint`, `localPoint`): `void`

Defined in: [rigid-body/rigid-body.ts:947](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L947)

将世界空间点转换为刚体本地空间点。

#### Parameters

##### worldPoint

世界空间点

###### x

`number`

###### y

`number`

###### z

`number`

##### localPoint

输出的本地空间点

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### getLocalVectorTo()

> **getLocalVectorTo**(`worldVector`, `localVector`): `void`

Defined in: [rigid-body/rigid-body.ts:959](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L959)

将世界空间向量转换为刚体本地空间向量。
仅转换方向，不包含位置偏移

#### Parameters

##### worldVector

世界空间向量

###### x

`number`

###### y

`number`

###### z

`number`

##### localVector

输出的本地空间向量

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### getMassDataTo()

> **getMassDataTo**(`massData`): `void`

Defined in: [rigid-body/rigid-body.ts:707](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L707)

获取质量数据（质量+本地转动惯量）并写入目标对象

#### Parameters

##### massData

[`MassData`](../../mass-data/classes/MassData.md)

目标质量数据对象

#### Returns

`void`

***

### getOrientationTo()

> **getOrientationTo**(`orientation`): `void`

Defined in: [rigid-body/rigid-body.ts:642](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L642)

获取刚体四元数并写入目标对象

#### Parameters

##### orientation

目标四元数对象

###### w

`number`

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### getPositionTo()

> **getPositionTo**(`position`): `object`

Defined in: [rigid-body/rigid-body.ts:498](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L498)

获取刚体位置并写入目标对象

#### Parameters

##### position

目标位置对象

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`object`

填充后的位置对象

##### x

> **x**: `number`

##### y

> **y**: `number`

##### z

> **z**: `number`

***

### getRotationFactorTo()

> **getRotationFactorTo**(`rotationFactor`): `void`

Defined in: [rigid-body/rigid-body.ts:728](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L728)

获取旋转因子并写入目标对象

#### Parameters

##### rotationFactor

目标旋转因子对象

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### getRotationTo()

> **getRotationTo**(`rotationMat3`): `void`

Defined in: [rigid-body/rigid-body.ts:594](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L594)

获取刚体旋转矩阵并写入目标对象

#### Parameters

##### rotationMat3

目标矩阵对象

###### elements

`number`[] \| `Float64Array`\<`ArrayBufferLike`\>

#### Returns

`void`

***

### getTransformTo()

> **getTransformTo**(`transform`): `void`

Defined in: [rigid-body/rigid-body.ts:672](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L672)

获取刚体变换矩阵并写入目标对象

#### Parameters

##### transform

[`Transform`](../../../common/transform/classes/Transform.md)

目标变换对象

#### Returns

`void`

***

### getWorldPointTo()

> **getWorldPointTo**(`localPoint`, `worldPoint`): `void`

Defined in: [rigid-body/rigid-body.ts:970](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L970)

将刚体本地空间点转换为世界空间点。

#### Parameters

##### localPoint

本地空间点

###### x

`number`

###### y

`number`

###### z

`number`

##### worldPoint

输出的世界空间点

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### getWorldVectorTo()

> **getWorldVectorTo**(`localVector`, `worldVector`): `void`

Defined in: [rigid-body/rigid-body.ts:982](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L982)

将刚体本地空间向量转换为世界空间向量。
仅转换方向，不包含位置偏移

#### Parameters

##### localVector

本地空间向量

###### x

`number`

###### y

`number`

###### z

`number`

##### worldVector

输出的世界空间向量

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### integrate()

> **integrate**(`dt`): `void`

Defined in: [rigid-body/rigid-body.ts:1016](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L1016)

积分刚体运动状态（位置和旋转）。
1. 静态刚体：重置所有速度为0
2. 动态/运动学刚体：
   - 限制最大平移和旋转量，防止数值不稳定
   - 积分线性速度更新位置
   - 积分角速度更新旋转（四元数方式）
   - 重新计算世界空间逆转动惯量

#### Parameters

##### dt

`number`

时间步长 (s)

#### Returns

`void`

***

### integratePseudoVelocity()

> **integratePseudoVelocity**(): `void`

Defined in: [rigid-body/rigid-body.ts:1082](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L1082)

积分伪速度，用于约束求解阶段的位置修正。
伪速度不代表真实的物理速度，仅用于碰撞响应的位置调整

#### Returns

`void`

***

### removeObject3D()

> **removeObject3D**(...`object3Ds`): `void`

Defined in: [rigid-body/rigid-body.ts:450](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L450)

移除3D渲染对象关联。
移除后会清空object3Ds的userData中的刚体引用

#### Parameters

##### object3Ds

...[`IObject3D`](../interfaces/IObject3D.md)[]

要移除的3D对象

#### Returns

`void`

***

### removeShape()

> **removeShape**(`shape`): `void`

Defined in: [rigid-body/rigid-body.ts:300](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L300)

从刚体移除碰撞形状。
1. 移除形状后会清理相关的接触约束
2. 如果刚体已加入物理世界，会销毁碰撞代理
3. 移除后会自动更新刚体质量和形状列表

#### Parameters

##### shape

[`Shape`](../../../shape/shape/classes/Shape.md)

要移除的形状

#### Returns

`void`

#### Throws

地形刚体移除形状时抛出错误

***

### rotate()

> **rotate**(`_rotationMat3`): `void`

Defined in: [rigid-body/rigid-body.ts:625](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L625)

旋转刚体（增量旋转）。
旋转后会更新逆转动惯量矩阵和形状列表

#### Parameters

##### \_rotationMat3

旋转增量矩阵

###### elements

`number`[] \| `Float64Array`\<`ArrayBufferLike`\>

#### Returns

`void`

#### Throws

地形刚体旋转时抛出错误

***

### setAngularVelocity()

> **setAngularVelocity**(`angularVelocity`): `void`

Defined in: [rigid-body/rigid-body.ts:784](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L784)

设置角速度，静态刚体速度会被置0

#### Parameters

##### angularVelocity

目标角速度

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### setLinearVelocity()

> **setLinearVelocity**(`linearVelocity`): `void`

Defined in: [rigid-body/rigid-body.ts:759](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L759)

设置线性速度，静态刚体速度会被置0

#### Parameters

##### linearVelocity

目标线性速度

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### setMassData()

> **setMassData**(`massData`): `void`

Defined in: [rigid-body/rigid-body.ts:716](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L716)

设置质量数据，会更新逆转动惯量矩阵

#### Parameters

##### massData

[`MassData`](../../mass-data/classes/MassData.md)

质量数据对象

#### Returns

`void`

***

### setOrientation()

> **setOrientation**(`_quaternion`): `void`

Defined in: [rigid-body/rigid-body.ts:654](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L654)

设置刚体四元数。
设置后会更新逆转动惯量矩阵和形状列表

#### Parameters

##### \_quaternion

目标四元数

###### w

`number`

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

#### Throws

地形刚体设置旋转时抛出错误

***

### setPosition()

> **setPosition**(`_position`): `void`

Defined in: [rigid-body/rigid-body.ts:509](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L509)

设置刚体位置。
设置后会更新形状列表并唤醒刚体

#### Parameters

##### \_position

目标位置

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### setRotation()

> **setRotation**(`_rotationMat3`): `void`

Defined in: [rigid-body/rigid-body.ts:605](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L605)

设置刚体旋转矩阵。
设置后会更新逆转动惯量矩阵和形状列表

#### Parameters

##### \_rotationMat3

目标旋转矩阵

###### elements

`number`[] \| `Float64Array`\<`ArrayBufferLike`\>

#### Returns

`void`

#### Throws

地形刚体设置旋转时抛出错误

***

### setRotationFactor()

> **setRotationFactor**(`rotationFactor`): `void`

Defined in: [rigid-body/rigid-body.ts:738](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L738)

设置旋转因子，用于调整各轴转动惯量。
设置后会重新计算逆转动惯量矩阵

#### Parameters

##### rotationFactor

旋转因子（x/y/z轴）

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### setTransform()

> **setTransform**(`transform`): `void`

Defined in: [rigid-body/rigid-body.ts:682](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L682)

设置刚体变换矩阵。
设置后会更新逆转动惯量矩阵和形状列表

#### Parameters

##### transform

[`Transform`](../../../common/transform/classes/Transform.md)

目标变换矩阵

#### Returns

`void`

#### Throws

地形刚体设置变换时抛出错误

***

### sleep()

> **sleep**(): `void`

Defined in: [rigid-body/rigid-body.ts:1001](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L1001)

强制刚体进入休眠状态。
休眠可提升物理引擎性能，休眠的刚体只有被外力作用时才会唤醒

#### Returns

`void`

***

### translate()

> **translate**(`_translation`): `void`

Defined in: [rigid-body/rigid-body.ts:482](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L482)

平移刚体位置。
平移后会更新形状列表并唤醒刚体

#### Parameters

##### \_translation

平移量

###### x

`number`

###### y

`number`

###### z

`number`

#### Returns

`void`

***

### updateMass()

> **updateMass**(): `void`

Defined in: [rigid-body/rigid-body.ts:526](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L526)

更新刚体的质量和转动惯量。
1. 遍历所有形状，累加质量和转动惯量
2. 计算形状本地转动惯量到刚体本地坐标系的变换
3. 应用平行轴定理修正转动惯量
4. 更新逆转动惯量矩阵

#### Returns

`void`

***

### updateObject3Ds()

> **updateObject3Ds**(): `void`

Defined in: [rigid-body/rigid-body.ts:470](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L470)

同步刚体的位置和旋转到所有关联的3D渲染对象。
通常在物理步进后调用，更新渲染对象的显示状态

#### Returns

`void`

***

### wakeUp()

> **wakeUp**(): `void`

Defined in: [rigid-body/rigid-body.ts:992](https://github.com/mrjordia/wuli.js/blob/bac1aebf7fcd638eb053ed18ec8eeaaaac3b8714/src/rigid-body/rigid-body.ts#L992)

唤醒刚体，退出休眠状态。
休眠的刚体不会参与物理计算，唤醒后重置休眠计时

#### Returns

`void`
