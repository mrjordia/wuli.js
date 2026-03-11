[**wuli.js API文档**](../README.md)

***

[wuli.js API文档](../modules.md) / wuli.js

# wuli.js

物理引擎核心模块导出（聚合所有公开API）。
轻量级3D物理引擎的顶层导出文件，整合所有核心模块、工具类、约束/碰撞检测/宽相位实现，
对外暴露统一的物理引擎API，便于业务层按需导入使用。

## References

### Aabb

Re-exports [Aabb](../common/aabb/classes/Aabb.md)

***

### AabbGeometry

Re-exports [AabbGeometry](../shape/aabb-geometry/classes/AabbGeometry.md)

***

### AabbTestCallback

Re-exports [AabbTestCallback](../common/aabb-test-callback/classes/AabbTestCallback.md)

***

### AabbTestWrapper

Re-exports [AabbTestWrapper](../common/aabb-test-wrapper/classes/AabbTestWrapper.md)

***

### BasisTracker

Re-exports [BasisTracker](../constraint/joint/basis-tracker/classes/BasisTracker.md)

***

### Boundary

Re-exports [Boundary](../constraint/solver/direct/boundary/classes/Boundary.md)

***

### BoundaryBuilder

Re-exports [BoundaryBuilder](../constraint/solver/direct/boundary-builder/classes/BoundaryBuilder.md)

***

### BoundaryBuildInfo

Re-exports [BoundaryBuildInfo](../constraint/solver/direct/boundary-build-info/classes/BoundaryBuildInfo.md)

***

### BoundarySelector

Re-exports [BoundarySelector](../constraint/solver/direct/boundary-selector/classes/BoundarySelector.md)

***

### BoxBoxDetector

Re-exports [BoxBoxDetector](../collision-detector/box-box-detector/box-box-detector/classes/BoxBoxDetector.md)

***

### BoxGeometry

Re-exports [BoxGeometry](../shape/box-geometry/classes/BoxGeometry.md)

***

### BROAD\_PHASE\_TYPE

Re-exports [BROAD_PHASE_TYPE](../constant/enumerations/BROAD_PHASE_TYPE.md)

***

### BroadPhase

Re-exports [BroadPhase](../broad-phase/broad-phase/classes/BroadPhase.md)

***

### BroadPhaseProxyCallback

Re-exports [BroadPhaseProxyCallback](../broad-phase/broad-phase-proxy-callback/classes/BroadPhaseProxyCallback.md)

***

### BruteForceBroadPhase

Re-exports [BruteForceBroadPhase](../broad-phase/brute-force-broad-phase/classes/BruteForceBroadPhase.md)

***

### BVH\_INSERTION\_STRATEGY

Re-exports [BVH_INSERTION_STRATEGY](../constant/enumerations/BVH_INSERTION_STRATEGY.md)

***

### BvhBroadPhase

Re-exports [BvhBroadPhase](../broad-phase/bvh-broad-phase/bvh-broad-phase/classes/BvhBroadPhase.md)

***

### BvhNode

Re-exports [BvhNode](../broad-phase/bvh-broad-phase/bvh-node/classes/BvhNode.md)

***

### BvhProxy

Re-exports [BvhProxy](../broad-phase/bvh-broad-phase/bvh-proxy/classes/BvhProxy.md)

***

### BvhStrategy

Re-exports [BvhStrategy](../broad-phase/bvh-broad-phase/bvh-strategy/classes/BvhStrategy.md)

***

### BvhTree

Re-exports [BvhTree](../broad-phase/bvh-broad-phase/bvh-tree/classes/BvhTree.md)

***

### CachedDetectorData

Re-exports [CachedDetectorData](../collision-detector/cached-detector-data/classes/CachedDetectorData.md)

***

### CapsuleCapsuleDetector

Re-exports [CapsuleCapsuleDetector](../collision-detector/capsule-capsule-detector/classes/CapsuleCapsuleDetector.md)

***

### CapsuleGeometry

Re-exports [CapsuleGeometry](../shape/capsule-geometry/classes/CapsuleGeometry.md)

***

### CollisionMatrix

Re-exports [CollisionMatrix](../collision-detector/collision-matrix/classes/CollisionMatrix.md)

***

### ConeGeometry

Re-exports [ConeGeometry](../shape/cone-geometry/classes/ConeGeometry.md)

***

### CONSTANT

Re-exports [CONSTANT](../constant/variables/CONSTANT.md)

***

### CONSTRAINT\_SOLVER\_TYPE

Re-exports [CONSTRAINT_SOLVER_TYPE](../constant/enumerations/CONSTRAINT_SOLVER_TYPE.md)

***

### ConstraintSolver

Re-exports [ConstraintSolver](../constraint/solver/constraint-solver/classes/ConstraintSolver.md)

***

### Contact

Re-exports [Contact](../constraint/contact/contact/classes/Contact.md)

***

### ContactCallback

Re-exports [ContactCallback](../common/contact-callback/classes/ContactCallback.md)

***

### ContactConstraint

Re-exports [ContactConstraint](../constraint/contact/contact-constraint/classes/ContactConstraint.md)

***

### ContactImpulse

Re-exports [ContactImpulse](../constraint/contact/contact-impulse/classes/ContactImpulse.md)

***

### ContactLink

Re-exports [ContactLink](../constraint/contact/contact-link/classes/ContactLink.md)

***

### ContactManager

Re-exports [ContactManager](../constraint/contact/contact-manager/classes/ContactManager.md)

***

### ContactSolverInfo

Re-exports [ContactSolverInfo](../constraint/contact/contact-solver-info/classes/ContactSolverInfo.md)

***

### ContactSolverInfoRow

Re-exports [ContactSolverInfoRow](../constraint/contact/contact-solver-info-row/classes/ContactSolverInfoRow.md)

***

### ContactSolverMassDataRow

Re-exports [ContactSolverMassDataRow](../constraint/solver/contact-solver-mass-data-row/classes/ContactSolverMassDataRow.md)

***

### ConvexCastWrapper

Re-exports [ConvexCastWrapper](../common/convex-cast-wrapper/classes/ConvexCastWrapper.md)

***

### ConvexGeometry

Re-exports [ConvexGeometry](../shape/convex-geometry/classes/ConvexGeometry.md)

***

### ConvexHullGeometry

Re-exports [ConvexHullGeometry](../shape/convex-hull-geometry/classes/ConvexHullGeometry.md)

***

### ConvexSweepGeometry

Re-exports [ConvexSweepGeometry](../shape/convex-sweep-geometry/classes/ConvexSweepGeometry.md)

***

### ConvexTerrainDetector

Re-exports [ConvexTerrainDetector](../collision-detector/convex-terrain-detector/classes/ConvexTerrainDetector.md)

***

### CylinderGeometry

Re-exports [CylinderGeometry](../shape/cylinder-geometry/classes/CylinderGeometry.md)

***

### CylindricalJoint

Re-exports [CylindricalJoint](../constraint/joint/cylindrical-joint/classes/CylindricalJoint.md)

***

### CylindricalJointConfig

Re-exports [CylindricalJointConfig](../constraint/joint/cylindrical-joint-config/classes/CylindricalJointConfig.md)

***

### DEFAULT\_33

Re-exports [DEFAULT_33](../common/method/variables/DEFAULT_33.md)

***

### Detector

Re-exports [Detector](../collision-detector/detector/classes/Detector.md)

***

### DetectorResult

Re-exports [DetectorResult](../collision-detector/detector-result/classes/DetectorResult.md)

***

### DetectorResultPoint

Re-exports [DetectorResultPoint](../collision-detector/detector-result-point/classes/DetectorResultPoint.md)

***

### DirectJointConstraintSolver

Re-exports [DirectJointConstraintSolver](../constraint/solver/direct/direct-joint-constraint-solver/classes/DirectJointConstraintSolver.md)

***

### EPA\_POLYHEDRON\_STATE

Re-exports [EPA_POLYHEDRON_STATE](../constant/enumerations/EPA_POLYHEDRON_STATE.md)

***

### EpaPolyhedron

Re-exports [EpaPolyhedron](../collision-detector/gjk-epa-detector/epa-polyhedron/classes/EpaPolyhedron.md)

***

### EpaTriangle

Re-exports [EpaTriangle](../collision-detector/gjk-epa-detector/epa-triangle/classes/EpaTriangle.md)

***

### EpaVertex

Re-exports [EpaVertex](../collision-detector/gjk-epa-detector/epa-vertex/classes/EpaVertex.md)

***

### FaceClipper

Re-exports [FaceClipper](../collision-detector/box-box-detector/face-clipper/classes/FaceClipper.md)

***

### GenericJoint

Re-exports [GenericJoint](../constraint/joint/generic-joint/classes/GenericJoint.md)

***

### GenericJointConfig

Re-exports [GenericJointConfig](../constraint/joint/generic-joint-config/classes/GenericJointConfig.md)

***

### Geometry

Re-exports [Geometry](../shape/geometry/classes/Geometry.md)

***

### GEOMETRY\_TYPE

Re-exports [GEOMETRY_TYPE](../constant/enumerations/GEOMETRY_TYPE.md)

***

### GJK\_EPA\_RESULT\_STATE

Re-exports [GJK_EPA_RESULT_STATE](../constant/enumerations/GJK_EPA_RESULT_STATE.md)

***

### GjkCache

Re-exports [GjkCache](../collision-detector/gjk-epa-detector/gjk-cache/classes/GjkCache.md)

***

### GjkEpa

Re-exports [GjkEpa](../collision-detector/gjk-epa-detector/gjk-epa/classes/GjkEpa.md)

***

### GjkEpaDetector

Re-exports [GjkEpaDetector](../collision-detector/gjk-epa-detector/gjk-epa-detector/classes/GjkEpaDetector.md)

***

### IncidentVertex

Re-exports [IncidentVertex](../collision-detector/box-box-detector/incident-vertex/classes/IncidentVertex.md)

***

### InfoDisplay

Re-exports [InfoDisplay](../common/info-display/classes/InfoDisplay.md)

***

### IObject3D

Re-exports [IObject3D](../rigid-body/rigid-body/interfaces/IObject3D.md)

***

### IRigidBodyConfigOptions

Re-exports [IRigidBodyConfigOptions](../rigid-body/rigid-body-config/interfaces/IRigidBodyConfigOptions.md)

***

### IShapeConfigOptions

Re-exports [IShapeConfigOptions](../shape/shape-config/interfaces/IShapeConfigOptions.md)

***

### ISimulateAnimation

Re-exports [ISimulateAnimation](../world/interfaces/ISimulateAnimation.md)

***

### Island

Re-exports [Island](../common/island/classes/Island.md)

***

### IWorldOptions

Re-exports [IWorldOptions](../world/interfaces/IWorldOptions.md)

***

### JACOBIAN\_ROW\_BIT

Re-exports [JACOBIAN_ROW_BIT](../constant/enumerations/JACOBIAN_ROW_BIT.md)

***

### JacobianRow

Re-exports [JacobianRow](../constraint/solver/jacobian-row/classes/JacobianRow.md)

***

### Joint

Re-exports [Joint](../constraint/joint/joint/classes/Joint.md)

***

### JOINT\_TYPE

Re-exports [JOINT_TYPE](../constant/enumerations/JOINT_TYPE.md)

***

### JointConfig

Re-exports [JointConfig](../constraint/joint/joint-config/classes/JointConfig.md)

***

### JointImpulse

Re-exports [JointImpulse](../constraint/joint/joint-impulse/classes/JointImpulse.md)

***

### JointLink

Re-exports [JointLink](../constraint/joint/joint-link/classes/JointLink.md)

***

### JointSolverInfo

Re-exports [JointSolverInfo](../constraint/joint/joint-solver-info/classes/JointSolverInfo.md)

***

### JointSolverInfoRow

Re-exports [JointSolverInfoRow](../constraint/joint/joint-solver-info-row/classes/JointSolverInfoRow.md)

***

### JointSolverMassDataRow

Re-exports [JointSolverMassDataRow](../constraint/joint/joint-solver-mass-data-row/classes/JointSolverMassDataRow.md)

***

### Manifold

Re-exports [Manifold](../constraint/contact/manifold/classes/Manifold.md)

***

### ManifoldPoint

Re-exports [ManifoldPoint](../constraint/contact/manifold-point/classes/ManifoldPoint.md)

***

### ManifoldUpdater

Re-exports [ManifoldUpdater](../constraint/contact/manifold-updater/classes/ManifoldUpdater.md)

***

### MassData

Re-exports [MassData](../rigid-body/mass-data/classes/MassData.md)

***

### MassMatrix

Re-exports [MassMatrix](../constraint/solver/direct/mass-matrix/classes/MassMatrix.md)

***

### Mat3

Re-exports [Mat3](../common/mat3/classes/Mat3.md)

***

### Method

Re-exports [Method](../common/method/classes/Method.md)

***

### Nullable

Re-exports [Nullable](../common/nullable/type-aliases/Nullable.md)

***

### PgsContactConstraintSolver

Re-exports [PgsContactConstraintSolver](../constraint/solver/pgs-contact-constraint-solver/classes/PgsContactConstraintSolver.md)

***

### PgsJointConstraintSolver

Re-exports [PgsJointConstraintSolver](../constraint/solver/pgs-joint-constraint-solver/classes/PgsJointConstraintSolver.md)

***

### PhysicsProxy

Re-exports [PhysicsProxy](../broad-phase/physics-proxy/classes/PhysicsProxy.md)

***

### POSITION\_CORRECTION\_ALGORITHM

Re-exports [POSITION_CORRECTION_ALGORITHM](../constant/enumerations/POSITION_CORRECTION_ALGORITHM.md)

***

### PreciseRayCaster

Re-exports [PreciseRayCaster](../collision-detector/precise-ray-caster/classes/PreciseRayCaster.md)

***

### PreciseRayCastResult

Re-exports [PreciseRayCastResult](../collision-detector/precise-ray-caster/interfaces/PreciseRayCastResult.md)

***

### PrismaticJoint

Re-exports [PrismaticJoint](../constraint/joint/prismatic-joint/classes/PrismaticJoint.md)

***

### PrismaticJointConfig

Re-exports [PrismaticJointConfig](../constraint/joint/prismatic-joint-config/classes/PrismaticJointConfig.md)

***

### ProxyPair

Re-exports [ProxyPair](../broad-phase/proxy-pair/classes/ProxyPair.md)

***

### Quat

Re-exports [Quat](../common/quat/classes/Quat.md)

***

### RagdollJoint

Re-exports [RagdollJoint](../constraint/joint/ragdoll-joint/classes/RagdollJoint.md)

***

### RagdollJointConfig

Re-exports [RagdollJointConfig](../constraint/joint/ragdoll-joint-config/classes/RagdollJointConfig.md)

***

### RayCastCallback

Re-exports [RayCastCallback](../common/ray-cast-callback/classes/RayCastCallback.md)

***

### RayCastClosest

Re-exports [RayCastClosest](../common/ray-cast-closest/classes/RayCastClosest.md)

***

### RayCastHit

Re-exports [RayCastHit](../shape/ray-cast-hit/classes/RayCastHit.md)

***

### RayCastWrapper

Re-exports [RayCastWrapper](../common/ray-cast-wrapper/classes/RayCastWrapper.md)

***

### RevoluteJoint

Re-exports [RevoluteJoint](../constraint/joint/revolute-joint/classes/RevoluteJoint.md)

***

### RevoluteJointConfig

Re-exports [RevoluteJointConfig](../constraint/joint/revolute-joint-config/classes/RevoluteJointConfig.md)

***

### RIGID\_BODY\_TYPE

Re-exports [RIGID_BODY_TYPE](../constant/enumerations/RIGID_BODY_TYPE.md)

***

### RigidBody

Re-exports [RigidBody](../rigid-body/rigid-body/classes/RigidBody.md)

***

### RigidBodyConfig

Re-exports [RigidBodyConfig](../rigid-body/rigid-body-config/classes/RigidBodyConfig.md)

***

### RotationalLimitMotor

Re-exports [RotationalLimitMotor](../constraint/joint/rotational-limit-motor/classes/RotationalLimitMotor.md)

***

### Shape

Re-exports [Shape](../shape/shape/classes/Shape.md)

***

### ShapeConfig

Re-exports [ShapeConfig](../shape/shape-config/classes/ShapeConfig.md)

***

### SIMULATE\_STATE

Re-exports [SIMULATE_STATE](../constant/enumerations/SIMULATE_STATE.md)

***

### SphereBoxDetector

Re-exports [SphereBoxDetector](../collision-detector/sphere-box-detector/classes/SphereBoxDetector.md)

***

### SphereCapsuleDetector

Re-exports [SphereCapsuleDetector](../collision-detector/sphere-capsule-detector/classes/SphereCapsuleDetector.md)

***

### SphereGeometry

Re-exports [SphereGeometry](../shape/sphere-geometry/classes/SphereGeometry.md)

***

### SphereSphereDetector

Re-exports [SphereSphereDetector](../collision-detector/sphere-sphere-detector/classes/SphereSphereDetector.md)

***

### SphericalJoint

Re-exports [SphericalJoint](../constraint/joint/spherical-joint/classes/SphericalJoint.md)

***

### SphericalJointConfig

Re-exports [SphericalJointConfig](../constraint/joint/spherical-joint-config/classes/SphericalJointConfig.md)

***

### SpringDamper

Re-exports [SpringDamper](../constraint/joint/spring-damper/classes/SpringDamper.md)

***

### TerrainGeometry

Re-exports [TerrainGeometry](../shape/terrain-geometry/classes/TerrainGeometry.md)

***

### TimeStep

Re-exports [TimeStep](../common/time-step/classes/TimeStep.md)

***

### Transform

Re-exports [Transform](../common/transform/classes/Transform.md)

***

### TRANSFORM\_OPTION

Re-exports [TRANSFORM_OPTION](../common/method/enumerations/TRANSFORM_OPTION.md)

***

### TranslationalLimitMotor

Re-exports [TranslationalLimitMotor](../constraint/joint/translational-limit-motor/classes/TranslationalLimitMotor.md)

***

### UniversalJoint

Re-exports [UniversalJoint](../constraint/joint/universal-joint/classes/UniversalJoint.md)

***

### UniversalJointConfig

Re-exports [UniversalJointConfig](../constraint/joint/universal-joint-config/classes/UniversalJointConfig.md)

***

### Vec3

Re-exports [Vec3](../common/vec3/classes/Vec3.md)

***

### World

Re-exports [World](../world/classes/World.md)
