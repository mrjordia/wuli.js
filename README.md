# wuli.js - 轻量级 TypeScript 物理引擎

基于bullet的碰撞检测与物理模拟轻量级引擎。

## 特性
- 纯 TypeScript 编写，类型完备
- 无外部依赖，可独立集成
- 支持常见的物理碰撞检测及约束
- 支持全量引用及按需引用
- 类型友好，方便根据需要裁剪冗余模块大幅减小体积

## 待办
- 地形模块
- 代码注释

## 安装
```bash  
npm install wuli  
# 或  
yarn add wuli
```
## 快速开始
```
// 导入核心模块  
import {  
  World,  
  Vec3,  
  RigidBody,  
  RigidBodyConfig,  
  RIGID_BODY_TYPE,  
  CapsuleGeometry,  
  Shape,  
  ShapeConfig  
} from 'wuli';  

// 1. 创建物理容器  
const world = new World({  
  gravity: new Vec3(0, -9.8, 0),  // 设置重力为竖直向下
});  
  
// 2. 创建刚体配置
const rigidBodyConfig = new RigidBodyConfig({  
  type: RIGID_BODY_TYPE.DYNAMIC, // 动态刚体：受力影响  
  position: new Vec3(-2, 0, 0) // 刚体初始位置  
});  
  
// 3. 创建胶囊几何形状（半径0.5，高度1）  
const capsuleGeometry = new CapsuleGeometry(0.5, 1);  
  
// 4. 创建碰撞形状并绑定几何  
const shapeConfig = new ShapeConfig({  
  geometry: capsuleGeometry, // 绑定胶囊几何  
});  
const shape = new Shape(shapeConfig);  
  
// 5. 创建刚体并添加碰撞形状  
const rigidBody = new RigidBody(rigidBodyConfig);  
rigidBody.addShape(shape);  
  
// 6. 将刚体添加到物理容器  
world.addRigidBody(rigidBody);  
  
// 7. 启动物理模拟循环（约60帧/秒，每帧步长0.016秒）  
const simulationInterval = setInterval(() => {  
  world.step(0.016); // 执行物理步进，更新刚体位置/状态  
}, 16);  

world.afterCall=()=>{
  // 更新角色控制等
};
```
### 或
```
// 创建自定义计算循环

// 导入接口
import { ISimulateAnimation } from 'wuli';

// 实现接口（自定义计算循环）
class AnimationRequest implements ISimulateAnimation{
  private _callback?:()=>void;

  constructor(interval:number){
    //...
  }

  public set callback(callback:Function){
    //...
  }
  public start(){
    //...
    if(this._callback)this._callback();
    //...
  }
  public stop(){
    //...
  }
}

//...............................................

// 导入核心模块  
import {  
  World,  
  Vec3,  
  RigidBody,  
  RigidBodyConfig,  
  RIGID_BODY_TYPE,  
  CapsuleGeometry,  
  Shape,  
  ShapeConfig,  
  SIMULATE_STATE
} from 'wuli';  
impor {AnimationRequest} from 'AnimationRequest 的路径'； // 导入自定义计算循环

// 创建物理容器
const world = new World({  
  gravity: new Vec3(0, -9.8, 0),
  simulateAnimation:(interval:number)=>{
    return new AnimationRequest(interval);
  }
});

world.simulate = SIMULATE_STATE.START;// 启动模拟
// world.simulate = SIMULATE_STATE.STOP;// 停止模拟
// world.simulate = SIMULATE_STATE.IMMEDIATELY;// 立即步进模拟一次

//其它逻辑
```