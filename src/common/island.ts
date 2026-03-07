import { CONSTANT, POSITION_CORRECTION_ALGORITHM, RIGID_BODY_TYPE } from "../constant";
import ConstraintSolver from "../constraint/solver/constraint-solver";
import RigidBody from "../rigid-body/rigid-body";
import Shape from "../shape/shape";
import { Nullable } from "./nullable";
import TimeStep from "./time-step";

/**
 * 物理引擎岛屿类。
 * 物理引擎核心优化机制，将相互关联的刚体和约束划分为独立“岛屿”并行求解，
 * 避免对整个物理世界的刚体进行全局求解，大幅提升计算效率；
 * 一个岛屿包含：相互接触/约束的刚体、对应的约束求解器、岛屿级重力向量。
 */
export default class Island {
    /** 岛屿内的刚体数组（初始容量由SETTING_ISLAND_INITIAL_RIGID_BODY_ARRAY_SIZE定义） */
    public rigidBodies: Array<Nullable<RigidBody>> = new Array(CONSTANT.SETTING_ISLAND_INITIAL_RIGID_BODY_ARRAY_SIZE);
    /** 岛屿内所有约束求解器（不分位置修正算法） */
    public solvers: Array<Nullable<ConstraintSolver>> = new Array(CONSTANT.SETTING_ISLAND_INITIAL_CONSTRAINT_ARRAY_SIZE);
    /** 采用SPLIT_IMPULSE（分离冲量）位置修正的约束求解器 */
    public solversSi: Array<Nullable<ConstraintSolver>> = new Array(CONSTANT.SETTING_ISLAND_INITIAL_CONSTRAINT_ARRAY_SIZE);
    /** 采用NGS（高斯赛德尔）位置修正的约束求解器 */
    public solversNgs: Array<Nullable<ConstraintSolver>> = new Array(CONSTANT.SETTING_ISLAND_INITIAL_CONSTRAINT_ARRAY_SIZE);
    /** 岛屿内刚体的实际数量（数组有效元素个数） */
    public numRigidBodies = 0;
    /** 岛屿内约束求解器的实际数量（solvers数组有效元素个数） */
    public numSolvers = 0;
    /** solversSi数组中有效约束求解器数量 */
    public numSolversSi = 0;
    /** solversNgs数组中有效约束求解器数量 */
    public numSolversNgs = 0;
    /** 岛屿级重力向量 [x, y, z]，作用于岛屿内所有刚体 */
    public gravity = new Float64Array(3);

    /**
     * 清空岛屿所有数据（重置数组和计数）。
     * 释放刚体/求解器引用（置null），重置所有计数为0；
     * 避免内存泄漏，岛屿复用前必须调用该方法。
     */
    public clear(): void {
        while (this.numRigidBodies > 0) this.rigidBodies[--this.numRigidBodies] = null;
        while (this.numSolvers > 0) this.solvers[--this.numSolvers] = null;
        while (this.numSolversSi > 0) this.solversSi[--this.numSolversSi] = null;
        while (this.numSolversNgs > 0) this.solversNgs[--this.numSolversNgs] = null;
    }

    /**
     * 向岛屿添加刚体。
     * 核心逻辑：
     * 1. 数组容量不足时自动扩容（2倍扩容）；
     * 2. 标记刚体`addedToIsland`为true，避免重复添加；
     * 3. 将刚体存入数组并递增计数。
     * @param {RigidBody} rigidBody - 待添加的刚体实例
     */
    public addRigidBody(rigidBody: RigidBody): void {
        if (this.numRigidBodies === this.rigidBodies.length) {
            const newArray = new Array(this.numRigidBodies << 1);
            let _g = 0, _g1 = this.numRigidBodies;
            while (_g < _g1) {
                const i = _g++;
                newArray[i] = this.rigidBodies[i];
                this.rigidBodies[i] = null;
            }
            this.rigidBodies = newArray;
        }
        rigidBody.addedToIsland = true;
        this.rigidBodies[this.numRigidBodies++] = rigidBody;
    }

    /**
     * 向岛屿添加约束求解器（按位置修正算法分类存储）。
     * 核心逻辑：
     * 1. solvers数组存储所有求解器（容量不足时2倍扩容）；
     * 2. 根据算法类型将求解器分类存入solversSi/ solversNgs数组；
     * 3. 标记求解器`addedToIsland`为true，避免重复添加。
     * @param {ConstraintSolver} solver - 待添加的约束求解器
     * @param {POSITION_CORRECTION_ALGORITHM} positionCorrection - 位置修正算法类型
     */
    public addConstraintSolver(solver: ConstraintSolver, positionCorrection: POSITION_CORRECTION_ALGORITHM): void {
        if (this.numSolvers === this.solvers.length) {
            const newArray = new Array(this.numSolvers << 1);
            let _g = 0, _g1 = this.numSolvers;
            while (_g < _g1) {
                const i = _g++;
                newArray[i] = this.solvers[i];
                this.solvers[i] = null;
            }
            this.solvers = newArray;
        }
        solver.addedToIsland = true;
        this.solvers[this.numSolvers++] = solver;
        if (positionCorrection === POSITION_CORRECTION_ALGORITHM.SPLIT_IMPULSE) {
            if (this.numSolversSi === this.solversSi.length) {
                const newArray = new Array(this.numSolversSi << 1);
                let _g = 0, _g1 = this.numSolversSi;
                while (_g < _g1) {
                    const i = _g++;
                    newArray[i] = this.solversSi[i];
                    this.solversSi[i] = null;
                }
                this.solversSi = newArray;
            }
            this.solversSi[this.numSolversSi++] = solver;
        }
        if (positionCorrection === POSITION_CORRECTION_ALGORITHM.NGS) {
            if (this.numSolversNgs === this.solversNgs.length) {
                const newArray = new Array(this.numSolversNgs << 1);
                let _g = 0, _g1 = this.numSolversNgs;
                while (_g < _g1) {
                    const i = _g++;
                    newArray[i] = this.solversNgs[i];
                    this.solversNgs[i] = null;
                }
                this.solversNgs = newArray;
            }
            this.solversNgs[this.numSolversNgs++] = solver;
        }
    }

    /**
     * 单刚体步进更新（独立更新单个刚体的物理状态）。
     * 核心逻辑：
     * 1. 重置刚体接触冲量和预测变换；
     * 2. 自动休眠检测（速度阈值+时间阈值）；
     * 3. 动态刚体：计算阻尼、加速度、速度更新、积分变换；
     * 4. 更新刚体所有形状的变换和AABB（合并预测/实际变换的AABB）；
     * 5. 移动形状的宽相位代理（若存在）。
     * @param {TimeStep} timeStep - 时间步信息（包含dt等）
     * @param {RigidBody} rb - 待更新的刚体
     */
    public stepSingleRigidBody(timeStep: TimeStep, rb: RigidBody): void {
        const SVT = CONSTANT.SETTING_SLEEPING_VELOCITY_THRESHOLD;
        const SAT = CONSTANT.SETTING_SLEEPING_ANGULAR_VELOCITY_THRESHOLD;
        const STT = CONSTANT.SETTING_SLEEPING_TIME_THRESHOLD;
        const RBD = RIGID_BODY_TYPE.DYNAMIC;
        const dt = timeStep.dt;
        const dst = rb.ptransform.elements;
        const src = rb.transform.elements;
        const lci = rb.linearContactImpulse, aci = rb.angularContactImpulse, vel = rb.vel, angVel = rb.angVel, force = rb.force, torque = rb.torque, im = rb.invMass, ii = rb.invInertia;
        const gt = this.gravity, gs = rb.gravityScale;
        dst[0] = src[0]; dst[1] = src[1]; dst[2] = src[2];
        dst[3] = src[3]; dst[4] = src[4]; dst[5] = src[5];
        dst[6] = src[6]; dst[7] = src[7]; dst[8] = src[8];
        dst[9] = src[9]; dst[10] = src[10]; dst[11] = src[11];
        lci[0] = lci[1] = lci[2] = 0;
        aci[0] = aci[1] = aci[2] = 0;
        if (rb.autoSleep && vel[0] * vel[0] + vel[1] * vel[1] + vel[2] * vel[2] < SVT * SVT &&
            angVel[0] * angVel[0] + angVel[1] * angVel[1] + angVel[2] * angVel[2] < SAT * SAT) {
            rb.sleepTime += dt;
            if (rb.sleepTime > STT) {
                rb.sleeping = true;
                rb.sleepTime = 0;
            }
        } else {
            rb.sleepTime = 0;
        }
        if (!rb.sleeping) {
            if (rb.type === RBD) {
                const x = dt * rb.linearDamping;
                const x2 = x * x;
                const linScale = 1 / (1 + x + x2 * (0.5 + x * 0.16666666666666666 + x * 0.16666666666666666 + x2 * 0.041666666666666664));
                const x1 = dt * rb.angularDamping;
                const x21 = x1 * x1;
                const angScale = 1 / (1 + x1 + x21 * (0.5 + x1 * 0.16666666666666666 + x21 * 0.041666666666666664));
                let linAccX = gt[0] * gs, linAccY = gt[1] * gs, linAccZ = gt[2] * gs;
                linAccX += force[0] * im; linAccY += force[1] * im; linAccZ += force[2] * im;
                const angAccX = ii[0] * torque[0] + ii[1] * torque[1] + ii[2] * torque[2];
                const angAccY = ii[3] * torque[0] + ii[4] * torque[1] + ii[5] * torque[2];
                const angAccZ = ii[6] * torque[0] + ii[7] * torque[1] + ii[8] * torque[2];
                vel[0] += linAccX * dt; vel[1] += linAccY * dt; vel[2] += linAccZ * dt;
                vel[0] *= linScale; vel[1] *= linScale; vel[2] *= linScale;
                angVel[0] += angAccX * dt; angVel[1] += angAccY * dt; angVel[2] += angAccZ * dt;
                angVel[0] *= angScale; angVel[1] *= angScale; angVel[2] *= angScale;
            }
            rb.integrate(dt);
            let s: Nullable<Shape> = rb.shapeList;
            while (s) {
                const n: Nullable<Shape> = s.next;
                const tf1 = rb.ptransform.elements;
                const tf2 = rb.transform.elements;
                const dst = s.ptransform.elements;
                const src1 = s.localTransform.elements;
                dst[3] = tf1[3] * src1[3] + tf1[4] * src1[6] + tf1[5] * src1[9];
                dst[4] = tf1[3] * src1[4] + tf1[4] * src1[7] + tf1[5] * src1[10];
                dst[5] = tf1[3] * src1[5] + tf1[4] * src1[8] + tf1[5] * src1[11];
                dst[6] = tf1[6] * src1[3] + tf1[7] * src1[6] + tf1[8] * src1[9];
                dst[7] = tf1[6] * src1[4] + tf1[7] * src1[7] + tf1[8] * src1[10];
                dst[8] = tf1[6] * src1[5] + tf1[7] * src1[8] + tf1[8] * src1[11];
                dst[9] = tf1[9] * src1[3] + tf1[10] * src1[6] + tf1[11] * src1[9];
                dst[10] = tf1[9] * src1[4] + tf1[10] * src1[7] + tf1[11] * src1[10];
                dst[11] = tf1[9] * src1[5] + tf1[10] * src1[8] + tf1[11] * src1[11];
                dst[0] = tf1[3] * src1[0] + tf1[4] * src1[1] + tf1[5] * src1[2];
                dst[1] = tf1[6] * src1[0] + tf1[7] * src1[1] + tf1[8] * src1[2];
                dst[2] = tf1[9] * src1[0] + tf1[10] * src1[1] + tf1[11] * src1[2];
                dst[0] += tf1[0]; dst[1] += tf1[1]; dst[2] += tf1[2];
                const dst1 = s.transform.elements;
                const src11 = s.localTransform.elements;
                dst1[3] = tf2[3] * src11[3] + tf2[4] * src11[6] + tf2[5] * src11[9];
                dst1[4] = tf2[3] * src11[4] + tf2[4] * src11[7] + tf2[5] * src11[10];
                dst1[5] = tf2[3] * src11[5] + tf2[4] * src11[8] + tf2[5] * src11[11];
                dst1[6] = tf2[6] * src11[3] + tf2[7] * src11[6] + tf2[8] * src11[9];
                dst1[7] = tf2[6] * src11[4] + tf2[7] * src11[7] + tf2[8] * src11[10];
                dst1[8] = tf2[6] * src11[5] + tf2[7] * src11[8] + tf2[8] * src11[11];
                dst1[9] = tf2[9] * src11[3] + tf2[10] * src11[6] + tf2[11] * src11[9];
                dst1[10] = tf2[9] * src11[4] + tf2[10] * src11[7] + tf2[11] * src11[10];
                dst1[11] = tf2[9] * src11[5] + tf2[10] * src11[8] + tf2[11] * src11[11];
                dst1[0] = tf2[3] * src11[0] + tf2[4] * src11[1] + tf2[5] * src11[2];
                dst1[1] = tf2[6] * src11[0] + tf2[7] * src11[1] + tf2[8] * src11[2];
                dst1[2] = tf2[9] * src11[0] + tf2[10] * src11[1] + tf2[11] * src11[2];
                dst1[0] += tf2[0]; dst1[1] += tf2[1]; dst1[2] += tf2[2];
                s.geometry.computeAabb(s.aabb, s.ptransform);
                const ab = s.aabb.elements;
                const minX = ab[0], minY = ab[1], minZ = ab[2];
                const maxX = ab[3], maxY = ab[4], maxZ = ab[5];
                s.geometry.computeAabb(s.aabb, s.transform);
                ab[0] = minX < ab[0] ? minX : ab[0]; ab[1] = minY < ab[1] ? minY : ab[1]; ab[2] = minZ < ab[2] ? minZ : ab[2];
                ab[3] = maxX > ab[3] ? maxX : ab[3]; ab[4] = maxY > ab[4] ? maxY : ab[4]; ab[5] = maxZ > ab[5] ? maxZ : ab[5];
                if (s.proxy) {
                    const v = s.displacement.elements, transform = s.transform.elements, ptransform = s.ptransform.elements;
                    v[0] = transform[0] - ptransform[0]; v[1] = transform[1] - ptransform[1]; v[2] = transform[2] - ptransform[2];
                    s.rigidBody!.world!.broadPhase.moveProxy(s.proxy, s.aabb, s.displacement);
                }
                s = n;
            }
        }
    }

    /**
     * 岛屿整体步进更新（核心物理求解逻辑）。
     * 核心流程（物理引擎单帧求解）：
     * 1. 预处理：重置刚体状态，检测岛屿是否满足整体休眠条件；
     * 2. 休眠判断：全岛刚体满足休眠条件则标记休眠并返回；
     * 3. 速度求解：预求解→热启动→迭代求解→后求解；
     * 4. 积分：更新刚体变换（速度→位置）；
     * 5. 位置修正：SPLIT_IMPULSE求解→伪速度积分→NGS求解；
     * 6. 后处理：更新所有形状的变换/AABB，移动宽相位代理。
     * @param {TimeStep} timeStep - 时间步信息
     * @param {number} numVelocityIterations - 速度求解迭代次数
     * @param {number} numPositionIterations - 位置求解迭代次数
     */
    public step(timeStep: TimeStep, numVelocityIterations: number, numPositionIterations: number): void {
        const SVT = CONSTANT.SETTING_SLEEPING_VELOCITY_THRESHOLD;
        const SAT = CONSTANT.SETTING_SLEEPING_ANGULAR_VELOCITY_THRESHOLD;
        const SLT = CONSTANT.SETTING_SLEEPING_TIME_THRESHOLD;
        const BTD = RIGID_BODY_TYPE.DYNAMIC;
        const dt = timeStep.dt;
        let sleepIsland = true, gt = this.gravity;
        let _g = 0, _g1 = this.numRigidBodies;
        while (_g < _g1) {
            const rb = this.rigidBodies[_g++]!;
            const dst = rb.ptransform.elements, src = rb.transform.elements;
            const vel = rb.vel, angVel = rb.angVel, gvs = rb.gravityScale, invMass = rb.invMass, force = rb.force, ii = rb.invInertia, torque = rb.torque;
            const linearContactImpulse = rb.linearContactImpulse;
            const angularContactImpulse = rb.angularContactImpulse;
            dst[0] = src[0]; dst[1] = src[1]; dst[2] = src[2]; dst[3] = src[3]; dst[4] = src[4]; dst[5] = src[5]; dst[6] = src[6]; dst[7] = src[7]; dst[8] = src[8]; dst[9] = src[9]; dst[10] = src[10]; dst[11] = src[11];
            linearContactImpulse[0] = linearContactImpulse[1] = linearContactImpulse[2] = 0;
            angularContactImpulse[0] = angularContactImpulse[1] = angularContactImpulse[2] = 0;
            rb.sleeping = false;
            if (rb.autoSleep && vel[0] * vel[0] + vel[1] * vel[1] + vel[2] * vel[2] < SVT * SVT &&
                angVel[0] * angVel[0] + angVel[1] * angVel[1] + angVel[2] * angVel[2] < SAT * SAT) {
                rb.sleepTime += dt;
            } else {
                rb.sleepTime = 0;
            }
            if (rb.sleepTime < SLT) {
                sleepIsland = false;
            }
            if (rb.type === BTD) {
                const x = dt * rb.linearDamping;
                const x2 = x * x;
                const linScale = 1 / (1 + x + x2 * (0.5 + x * 0.16666666666666666 + x2 * 0.041666666666666664));
                const x1 = dt * rb.angularDamping;
                const x21 = x1 * x1;
                const angScale = 1 / (1 + x1 + x21 * (0.5 + x1 * 0.16666666666666666 + x21 * 0.041666666666666664));
                let linAccX = gt[0] * gvs, linAccY = gt[1] * gvs, linAccZ = gt[2] * gvs;
                linAccX += force[0] * invMass; linAccY += force[1] * invMass; linAccZ += force[2] * invMass;
                const angAccX = ii[0] * torque[0] + ii[1] * torque[1] + ii[2] * torque[2];
                const angAccY = ii[3] * torque[0] + ii[4] * torque[1] + ii[5] * torque[2];
                const angAccZ = ii[6] * torque[0] + ii[7] * torque[1] + ii[8] * torque[2];
                vel[0] += linAccX * dt; vel[1] += linAccY * dt; vel[2] += linAccZ * dt;
                vel[0] *= linScale; vel[1] *= linScale; vel[2] *= linScale;
                angVel[0] += angAccX * dt; angVel[1] += angAccY * dt; angVel[2] += angAccZ * dt;
                angVel[0] *= angScale; angVel[1] *= angScale; angVel[2] *= angScale;
            }
        }
        if (sleepIsland) {
            let _g = 0, _g1 = this.numRigidBodies;
            while (_g < _g1) {
                const rb = this.rigidBodies[_g++]!;
                rb.sleeping = true;
                rb.sleepTime = 0;
            }
            return;
        }
        let _g2 = 0, _g3 = this.numSolvers;
        while (_g2 < _g3) this.solvers[_g2++]!.preSolveVelocity(timeStep);
        let _g4 = 0, _g5 = this.numSolvers;
        while (_g4 < _g5) this.solvers[_g4++]!.warmStart(timeStep);
        let _g6 = 0;
        while (_g6 < numVelocityIterations) {
            ++_g6;
            let _g = 0, _g1 = this.numSolvers;
            while (_g < _g1) this.solvers[_g++]!.solveVelocity();
        }
        let _g7 = 0, _g8 = this.numSolvers;
        while (_g7 < _g8) this.solvers[_g7++]!.postSolveVelocity(timeStep);
        let _g9 = 0, _g10 = this.numRigidBodies;
        while (_g9 < _g10) this.rigidBodies[_g9++]!.integrate(dt);
        let _g11 = 0, _g12 = this.numSolversSi;
        while (_g11 < _g12) this.solversSi[_g11++]!.preSolvePosition(timeStep);
        let _g13 = 0;
        while (_g13 < numPositionIterations) {
            ++_g13;
            let _g = 0, _g1 = this.numSolversSi;
            while (_g < _g1) this.solversSi[_g++]!.solvePositionSplitImpulse();
        }
        let _g14 = 0, _g15 = this.numRigidBodies;
        while (_g14 < _g15) this.rigidBodies[_g14++]!.integratePseudoVelocity();
        let _g16 = 0, _g17 = this.numSolversNgs;
        while (_g16 < _g17) this.solversNgs[_g16++]!.preSolvePosition(timeStep);
        let _g18 = 0;
        while (_g18 < numPositionIterations) {
            ++_g18;
            let _g = 0, _g1 = this.numSolversNgs;
            while (_g < _g1) this.solversNgs[_g++]!.solvePositionNgs(timeStep);
        }
        let _g19 = 0, _g20 = this.numSolvers;
        while (_g19 < _g20) this.solvers[_g19++]!.postSolve();
        let _g21 = 0, _g22 = this.numRigidBodies;
        while (_g21 < _g22) {
            const rb = this.rigidBodies[_g21++]!;
            let s: Nullable<Shape> = rb.shapeList;
            while (s) {
                const n: Nullable<Shape> = s.next;
                const tf1 = rb.ptransform.elements;
                const tf2 = rb.transform.elements;
                const dst = s.ptransform.elements;
                const src1 = s.localTransform.elements;
                dst[3] = tf1[3] * src1[3] + tf1[4] * src1[6] + tf1[5] * src1[9];
                dst[4] = tf1[3] * src1[4] + tf1[4] * src1[7] + tf1[5] * src1[10];
                dst[5] = tf1[3] * src1[5] + tf1[4] * src1[8] + tf1[5] * src1[11];
                dst[6] = tf1[6] * src1[3] + tf1[7] * src1[6] + tf1[8] * src1[9];
                dst[7] = tf1[6] * src1[4] + tf1[7] * src1[7] + tf1[8] * src1[10];
                dst[8] = tf1[6] * src1[5] + tf1[7] * src1[8] + tf1[8] * src1[11];
                dst[9] = tf1[9] * src1[3] + tf1[10] * src1[6] + tf1[11] * src1[9];
                dst[10] = tf1[9] * src1[4] + tf1[10] * src1[7] + tf1[11] * src1[10];
                dst[11] = tf1[9] * src1[5] + tf1[10] * src1[8] + tf1[11] * src1[11];
                dst[0] = tf1[3] * src1[0] + tf1[4] * src1[1] + tf1[5] * src1[2];
                dst[1] = tf1[6] * src1[0] + tf1[7] * src1[1] + tf1[8] * src1[2];
                dst[2] = tf1[9] * src1[0] + tf1[10] * src1[1] + tf1[11] * src1[2];
                dst[0] += tf1[0]; dst[1] += tf1[1]; dst[2] += tf1[2];
                const dst1 = s.transform.elements;
                const src11 = s.localTransform.elements;
                dst1[3] = tf2[3] * src11[3] + tf2[4] * src11[6] + tf2[5] * src11[9];
                dst1[4] = tf2[3] * src11[4] + tf2[4] * src11[7] + tf2[5] * src11[10];
                dst1[5] = tf2[3] * src11[5] + tf2[4] * src11[8] + tf2[5] * src11[11];
                dst1[6] = tf2[6] * src11[3] + tf2[7] * src11[6] + tf2[8] * src11[9];
                dst1[7] = tf2[6] * src11[4] + tf2[7] * src11[7] + tf2[8] * src11[10];
                dst1[8] = tf2[6] * src11[5] + tf2[7] * src11[8] + tf2[8] * src11[11];
                dst1[9] = tf2[9] * src11[3] + tf2[10] * src11[6] + tf2[11] * src11[9];
                dst1[10] = tf2[9] * src11[4] + tf2[10] * src11[7] + tf2[11] * src11[10];
                dst1[11] = tf2[9] * src11[5] + tf2[10] * src11[8] + tf2[11] * src11[11];
                dst1[0] = tf2[3] * src11[0] + tf2[4] * src11[1] + tf2[5] * src11[2];
                dst1[1] = tf2[6] * src11[0] + tf2[7] * src11[1] + tf2[8] * src11[2];
                dst1[2] = tf2[9] * src11[0] + tf2[10] * src11[1] + tf2[11] * src11[2];
                dst1[0] += tf2[0]; dst1[1] += tf2[1]; dst1[2] += tf2[2];
                s.geometry.computeAabb(s.aabb, s.ptransform);
                const ab = s.aabb.elements;
                const minX = ab[0], minY = ab[1], minZ = ab[2];
                const maxX = ab[3], maxY = ab[4], maxZ = ab[5];
                s.geometry.computeAabb(s.aabb, s.transform);
                ab[0] = minX < ab[0] ? minX : ab[0]; ab[1] = minY < ab[1] ? minY : ab[1]; ab[2] = minZ < ab[2] ? minZ : ab[2];
                ab[3] = maxX > ab[3] ? maxX : ab[3]; ab[4] = maxY > ab[4] ? maxY : ab[4]; ab[5] = maxZ > ab[5] ? maxZ : ab[5];
                if (s.proxy) {
                    const v = s.displacement.elements, transform = s.transform.elements, ptransform = s.ptransform.elements;
                    v[0] = transform[0] - ptransform[0]; v[1] = transform[1] - ptransform[1]; v[2] = transform[2] - ptransform[2];
                    s.rigidBody!.world!.broadPhase.moveProxy(s.proxy, s.aabb, s.displacement);
                }
                s = n;
            }
        }
    }
}

export { Island };