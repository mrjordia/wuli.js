import { Nullable } from "../../common/nullable";
import TimeStep from "../../common/time-step";
import RigidBody from "../../rigid-body/rigid-body";


export default abstract class ConstraintSolver {
	protected _b1: Nullable<RigidBody>;
	protected _b2: Nullable<RigidBody>;
	public addedToIsland = false;

	public abstract preSolveVelocity(timeStep: TimeStep): void;
	public abstract warmStart(timeStep: TimeStep): void;
	public abstract solveVelocity(): void;
	public abstract postSolveVelocity(timeStep: TimeStep): void;
	public abstract preSolvePosition(timeStep: TimeStep): void;
	public abstract solvePositionSplitImpulse(): void;
	public abstract solvePositionNgs(timeStep: TimeStep): void;
	public abstract postSolve(): void;
}