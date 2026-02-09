import { Precision } from "@rian8337/osu-base";
import { Bindable } from "./Bindable";
import { ValueChangedEvent } from "./ValueChangedEvent";
import { NumberHelper } from "@utils/helpers/NumberHelper";

/**
 * A `Bindable` that has the utility to limit numbers to a certain precision.
 */
export class BindableNumber extends Bindable<number> {
    /**
     * All events which are raised when the precision value of this `BindableNumber`
     * has been changed (or manually via `triggerPrecisionChange`).
     */
    private readonly _precisionChanged: ValueChangedEvent<number>[] = [];

    /**
     * All events which are raised when the precision value of this `BindableNumber`
     * has been changed (or manually via `triggerPrecisionChange`).
     */
    get precisionChanged(): readonly ValueChangedEvent<number>[] {
        return this._precisionChanged;
    }

    /**
     * All events which are raised when the minimum value of this `BindableNumber`
     * has been changed (or manually via `triggerMinValueChange`).
     */
    private readonly _minValueChanged: ValueChangedEvent<number>[] = [];

    /**
     * All events which are raised when the minimum value of this `BindableNumber`
     * has been changed (or manually via `triggerMinValueChange`).
     */
    get minValueChanged(): readonly ValueChangedEvent<number>[] {
        return this._minValueChanged;
    }

    /**
     * All events which are raised when the maximum value of this `BindableNumber`
     * has been changed (or manually via `triggerMaxValueChange`).
     */
    private readonly _maxValueChanged: ValueChangedEvent<number>[] = [];

    /**
     * All events which are raised when the maximum value of this `BindableNumber`
     * has been changed (or manually via `triggerMaxValueChange`).
     */
    get maxValueChanged(): readonly ValueChangedEvent<number>[] {
        return this._maxValueChanged;
    }

    private _defaultMinValue: number = Number.MIN_VALUE;

    /**
     * The default minimum value. This should be equal to the minimum value of the type of
     * this `BindableNumber`.
     */
    get defaultMinValue(): number {
        return this._defaultMinValue;
    }

    private _defaultMaxValue: number = Number.MAX_VALUE;

    /**
     * The default maximum value. This should be equal to the maximum value of the type of
     * this `BindableNumber`.
     */
    get defaultMaxValue(): number {
        return this._defaultMaxValue;
    }

    /**
     * The minimum value of this `BindableNumber`.
     */
    private _minValue: number = this._defaultMinValue;

    /**
     * The minimum value of this `BindableNumber`.
     */
    get minValue(): number {
        return this._minValue;
    }

    /**
     * The minimum value of this `BindableNumber`.
     */
    set minValue(value: number) {
        if (this._minValue === value) {
            return;
        }

        this.setMinValue(value, true, this);
    }

    private _maxValue: number = this._defaultMaxValue;

    /**
     * The maximum value of this `BindableNumber`.
     */
    get maxValue(): number {
        return this._maxValue;
    }

    /**
     * The maximum value of this `BindableNumber`.
     */
    set maxValue(value: number) {
        if (this._maxValue === value) {
            return;
        }

        this.setMaxValue(value, true, this);
    }

    /**
     * Whether this `BindableNumber` has a user-defined range that is not the full range of the
     * type of this `BindableNumber`.
     */
    get hasDefinedRange(): boolean {
        return (
            this._minValue !== this._defaultMinValue ||
            this._maxValue !== this._defaultMaxValue
        );
    }

    /**
     * The default precision of a `BindableNumber`.
     */
    static readonly defaultPrecision: number = Number.EPSILON;

    constructor(defaultValue: number = 0) {
        super(defaultValue);

        // Re-apply the current value to apply the default precision value
        this._setValue(this.value);
    }

    private _precision: number = BindableNumber.defaultPrecision;

    /**
     * The precision of this `BindableNumber`.
     */
    get precision(): number {
        return this._precision;
    }

    /**
     * The precision of this `BindableNumber`.
     */
    set precision(value: number) {
        if (this._precision === value) {
            return;
        }

        if (value <= 0) {
            throw new RangeError("Precision must be greater than 0.");
        }

        this.setPrecision(value, true, this);
    }

    protected setPrecision(
        precision: number,
        updateCurrentValue: boolean,
        source: BindableNumber,
    ): void {
        const prev: number = this._precision;
        this._precision = precision;

        this.triggerPrecisionChange(prev, source);

        if (updateCurrentValue) {
            // Re-apply the current value to apply the new precision
            this._setValue(this.value);
        }
    }

    /**
     * Binds an event to `precisionChanged` with the option of running the bound action once immediately.
     *
     * @param onChange The event to raise when the precision of this `BindableNumber` changes.
     * @param runOnceImmediately Whether the action provided in `onChange` should be run once immediately.
     */
    bindPrecisionChanged(
        onChange: ValueChangedEvent<number>,
        runOnceImmediately?: boolean,
    ): void {
        this._precisionChanged.push(onChange);

        if (runOnceImmediately) {
            onChange(this._precision, this._precision);
        }
    }

    /**
     * Unbinds an event from `precisionChanged`.
     *
     * @param onChange The event to unbind.
     */
    unbindPrecisionChanged(onChange: ValueChangedEvent<number>): void {
        this.removeEvent(onChange, this._precisionChanged);
    }

    /**
     * Binds an event to `minValueChanged` with the option of running the bound action once immediately.
     *
     * @param onChange The event to raise when the minimum value of this `RangeConstrainedBindable` changes.
     * @param runOnceImmediately Whether the action provided in `onChange` should be run once immediately.
     */
    bindMinValueChanged(
        onChange: ValueChangedEvent<number>,
        runOnceImmediately?: boolean,
    ): void {
        this._minValueChanged.push(onChange);

        if (runOnceImmediately) {
            onChange(this._minValue, this._minValue);
        }
    }

    /**
     * Unbinds an event from `minValueChanged`.
     *
     * @param onChange The event to unbind.
     */
    unbindMinValueChanged(onChange: ValueChangedEvent<number>): void {
        this.removeEvent(onChange, this._minValueChanged);
    }

    /**
     * Binds an event to `maxValueChanged` with the option of running the bound action once immediately.
     *
     * @param onChange The event to raise when the maximum value of this `RangeConstrainedBindable` changes.
     * @param runOnceImmediately Whether the action provided in `onChange` should be run once immediately.
     */
    bindMaxValueChanged(
        onChange: ValueChangedEvent<number>,
        runOnceImmediately?: boolean,
    ): void {
        this._maxValueChanged.push(onChange);

        if (runOnceImmediately) {
            onChange(this._maxValue, this._maxValue);
        }
    }

    /**
     * Unbinds an event from `maxValueChanged`.
     *
     * @param onChange The event to unbind.
     */
    unbindMaxValueChanged(onChange: ValueChangedEvent<number>): void {
        this.removeEvent(onChange, this._maxValueChanged);
    }

    /**
     * Sets the minimum value. This method does no equality comparisons.
     *
     * @param minValue The new minimum value.
     * @param updateCurrentValue Whether to update the current value.
     * @param source The `RangeConstrainedBindable` that triggered this. A `null`
     * value represents the current `RangeConstrainedBindable`.
     */
    protected setMinValue(
        minValue: number,
        updateCurrentValue: boolean,
        source: BindableNumber | null,
    ): void {
        const prev: number = this._minValue;

        this._minValue = minValue;

        this.triggerMinValueChange(prev, source);

        if (updateCurrentValue) {
            // Reapply the current value to respect the new minimum value.
            this._setValue(this.value);
        }
    }

    /**
     * Sets the maximum value. This method does no equality comparisons.
     *
     * @param maxValue The new maximum value.
     * @param updateCurrentValue Whether to update the current value.
     * @param source The `RangeConstrainedBindable` that triggered this. A `null`
     * value represents the current `RangeConstrainedBindable`.
     */
    protected setMaxValue(
        maxValue: number,
        updateCurrentValue: boolean,
        source: BindableNumber | null,
    ) {
        const prev: number = this._maxValue;
        this._maxValue = maxValue;
        this.triggerMaxValueChange(prev, source);

        if (updateCurrentValue) {
            // Reapply the current value to respect the new maximum value.
            this._setValue(this.value);
        }
    }

    override get value(): number {
        return super.value;
    }

    override set value(value: number) {
        this._setValue(value);
    }

    private _setValue(value: number): void {
        if (this.precision > BindableNumber.defaultPrecision) {
            const clampedValue: number = this.clampValue(
                value,
                this.minValue,
                this.maxValue,
            );

            super.value =
                Math.round(clampedValue / this.precision) * this.precision;
        } else {
            super.value = value;
        }
    }

    /**
     * Raise `valueChanged`, `disabledChanged`, `minValueChanged`, `maxValueChanged`, and
     * `precisionChanged` once, without any changes actually occurring.
     * This does not propagate to any outward bound `BindableNumber`s.
     */
    override triggerChange(): void {
        super.triggerChange();

        this.triggerMinValueChange(this.minValue, this, false);
        this.triggerMaxValueChange(this.maxValue, this, false);
        this.triggerPrecisionChange(this.precision, this, false);
    }

    protected triggerPrecisionChange(
        previousValue: number,
        source: BindableNumber | null,
        propagateToBindings: boolean = true,
    ): void {
        // Check a bound bindable hasn't changed the value again (it will fire its own event)
        const beforePropagation: number = this._precision;

        if (propagateToBindings && this.bindings) {
            for (const b of this.bindings) {
                if (!b) {
                    continue;
                }

                if (b === source) {
                    continue;
                }

                if (b instanceof BindableNumber) {
                    b.setPrecision(this._precision, false, this);
                }
            }
        }

        if (beforePropagation === this._precision) {
            for (const c of this._precisionChanged) {
                c(previousValue, this._precision);
            }
        }
    }

    protected triggerMinValueChange(
        previousValue: number,
        source: BindableNumber | null,
        propagateToBindings: boolean = true,
    ): void {
        // Check a bound bindable hasn't changed the value again (it will fire its own event)
        const beforePropagation: number = this._minValue;

        if (propagateToBindings && this.bindings) {
            for (const b of this.bindings) {
                if (!b) {
                    continue;
                }

                if (b === source) {
                    continue;
                }

                if (b instanceof BindableNumber) {
                    b.setMinValue(this._minValue, false, this);
                }
            }
        }

        if (beforePropagation === this._minValue) {
            for (const c of this._minValueChanged) {
                c(previousValue, this._minValue);
            }
        }
    }

    protected triggerMaxValueChange(
        previousValue: number,
        source: BindableNumber | null,
        propagateToBindings: boolean = true,
    ): void {
        // Check a bound bindable hasn't changed the value again (it will fire its own event)
        const beforePropagation: number = this._maxValue;

        if (propagateToBindings && this.bindings) {
            for (const b of this.bindings) {
                if (!b) {
                    continue;
                }

                if (b === source) {
                    continue;
                }

                if (b instanceof BindableNumber) {
                    b.setMaxValue(this._maxValue, false, this);
                }
            }
        }

        if (beforePropagation === this._maxValue) {
            for (const c of this._maxValueChanged) {
                c(previousValue, this._maxValue);
            }
        }
    }

    override copyTo(them: Bindable<number>): void {
        if (them instanceof BindableNumber) {
            them.minValue = this.minValue;
            them.maxValue = this.maxValue;
            them.precision = this.precision;
        }

        super.copyTo(them);
    }

    override bindTo(them: Bindable<number>): void {
        if (them instanceof BindableNumber) {
            if (!this.isValidRange(them.minValue, them.maxValue)) {
                throw new RangeError(
                    `The target bindable has specified an invalid range of [${them.minValue} - ${them.maxValue}].`,
                );
            }
        }

        super.bindTo(them);
    }

    override unbindEvents(): void {
        super.unbindEvents();

        this._minValueChanged.length = 0;
        this._maxValueChanged.length = 0;
        this._precisionChanged.length = 0;
    }

    override getBoundCopy(): BindableNumber {
        return <BindableNumber>super.getBoundCopy();
    }

    override getUnboundCopy(): BindableNumber {
        return <BindableNumber>super.getUnboundCopy();
    }

    override get isDefault(): boolean {
        // Take 50% of the precision to ensure the value doesn't underflow and return true for non-default values.
        return Precision.almostEquals(
            this.value,
            this.defaultValue,
            this.precision / 2,
        );
    }

    protected override createInstance(): BindableNumber {
        return new BindableNumber();
    }

    /**
     * Checks whether `min` and `max` constitute a valid range (usually used to check that
     * `min` is indeed lesser than or equal to `max`).
     *
     * @param min The range's minimum value.
     * @param max The range's maximum value.
     */
    protected clampValue(
        value: number,
        minValue: number,
        maxValue: number,
    ): number {
        return NumberHelper.clamp(value, minValue, maxValue);
    }

    /**
     * Clamps `value` to the range defined by `minValue` and `maxValue`.
     */
    protected isValidRange(min: number, max: number): boolean {
        return min <= max;
    }
}
