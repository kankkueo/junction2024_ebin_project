import { IPlugin } from "../../plugin";
import { Viewer } from "../../../viewer";
import { ChannelType, IHeatmapChannel } from "./heatmap-channel";
import { ModelHandle } from "../../../model-handle";
import { HeatmapSource } from "./heatmap-source";
import { ContinuousHeatmapChannel } from "./continuous-heatmap-channel";
import { DiscreteHeatmapChannel } from "./discrete-heatmap-channel";
import { ValueRangesHeatmapChannel } from "./value-ranges-heatmap-channel";
import { State } from "../../../common";

/**
 * @category Plugins
 */
export class Heatmap implements IPlugin {
    private _viewer: Viewer = null;
    private _channels: IHeatmapChannel[] = [];
    private _sources: HeatmapSource[] = [];
    private _colorStylesMap: { [colorHex: string]: number } = {};
    private _valueStylesMap: { [normalizedValue: number]: number } = {};
    private _stopped = true;
    private _nextStyleId: number = 0;

    public get channels(): IHeatmapChannel[] { return this._channels; }

    public get stopped(): boolean { return this._stopped; }

    public set stopped(value: boolean) {
        this._stopped = value;
        if (this._viewer) {
            this._viewer.draw();
        }
    }

    public init(viewer: Viewer): void {
        this._viewer = viewer;
    }

    public addChannel(channel: IHeatmapChannel): void {
        var existing = this.channels.filter(c => c.channelId === channel.channelId).pop();
        if (existing) {
            const msg = `A channel with this Id '${channel.channelId}' already exists.`;
            console.error(msg)
            throw new Error(msg);
        }
        this._channels.push(channel);
    }

    public addSource(source: HeatmapSource): void {
        var existing = this._sources.filter(c => c.id === source.id).pop();
        if (existing) {
            const msg = `A source with this Id '${source.id}' already exists.`
            console.error(msg)
            throw new Error(msg);
        }

        const channel = this._channels.filter(c => c.channelId === source.channelId).pop();
        if (channel) {
            this._sources.push(source);
        }
        else {
            const msg = `No channel with Id '${source.channelId}' exists for this source '${source.id}'.`;
            console.error(msg)
            throw new Error(msg);
        }

    }

    public renderChannel(channelId: string) {
        const channel = this._channels.filter(c => c.channelId === channelId).pop();
        this.renderChannelInternal(channel);
    }

    public getChannel(channelId: string): IHeatmapChannel {
        const channel = this._channels.filter(c => c.channelId === channelId).pop();
        return channel;
    }

    public renderSource(sourceId: string) {
        const source = this._sources.filter(c => c.id === sourceId).pop();
        if (source) {
            const channel = this._channels.filter(c => c.channelId === source.channelId).pop();
            this.renderChannelInternal(channel, [source]);
        }
        else {
            const msg = `No source registered with this Id '${source.id}'.`;
            console.error(msg)
            throw new Error(msg);
        }
    }

    private renderChannelInternal(channel: IHeatmapChannel, sources: HeatmapSource[] = null) {
        if (channel) {
            switch (channel.channelType) {
                case ChannelType.Continuous: {
                    this.renderContinuousChannel(channel as ContinuousHeatmapChannel, sources);
                    return;
                }
                case ChannelType.Discrete: {
                    this.renderDiscreteChannel(channel as DiscreteHeatmapChannel, sources);
                    return;
                }
                case ChannelType.ValueRanges: {
                    this.renderValueRangesChannel(channel as ValueRangesHeatmapChannel, sources);
                    return;
                }
            }
        }
        else {
            const msg = `No channel registered with this Id '${channel.channelId}'.`;
            throw new Error(msg);
        }
    }

    private renderDiscreteChannel(channel: DiscreteHeatmapChannel, sources: HeatmapSource[] = null) {
        const colorVals = Object.values(channel.values);
        colorVals.forEach(colorHex => {
            if (this._colorStylesMap[colorHex])
                return;

            const rgba = this.hexToRgba(colorHex);
            this._viewer.defineStyle(this._nextStyleId, rgba);
            this._colorStylesMap[colorHex] = this._nextStyleId;
            this._nextStyleId++;
        });
        const values = Object.keys(channel.values);
        const maps = (sources ?? this._sources).filter(s => s.channelId == channel.channelId);
        const groups = this.groupBy(maps, m => `${m.value}-${m.modelId}`);
        groups.forEach(group => {
            const stringVal = group[0].value.toString();
            if (values.includes(stringVal)) {
                const colorHex = channel.values[group[0].value];
                const products: number[] = group.reduce((ps, c) => { ps.push(c.productId); return ps; }, []);
                this._viewer.setStyle(this._colorStylesMap[colorHex], products, group[0].modelId);
                this._viewer.addState(State.XRAYVISIBLE, products, group[0].modelId)
            }
        });
    }

    private renderValueRangesChannel(channel: ValueRangesHeatmapChannel, sources: HeatmapSource[] = null) {
        const colorVals = channel.valueRanges.map(vr => vr.color);
        colorVals.forEach(colorHex => {
            if (this._colorStylesMap[colorHex])
                return;

            const rgba = this.hexToRgba(colorHex);
            this._viewer.defineStyle(this._nextStyleId, rgba);
            this._colorStylesMap[colorHex] = this._nextStyleId;
            this._nextStyleId++;
        });

        const maps = (sources ?? this._sources).filter(s => s.channelId == channel.channelId);
        const initial: Array<{ color: string, sources: HeatmapSource[][] }> = [];
        const ranges = channel.valueRanges.reduce((result, range) => {
            const inRange = maps.filter(m => {
                const value = Number(m.value);
                if (isNaN(value))
                    return false;
                return value >= range.min && value <= range.max;
            });
            result.push({
                color: range.color,
                sources: this.groupBy(inRange, r => `${r.modelId}`)
            });
            return result;
        }, initial).filter(r => r.sources.length > 0);

        ranges.forEach(range => {
            range.sources.forEach(group => {
                const products: number[] = group.reduce((ps, c) => { ps.push(c.productId); return ps; }, []);
                this._viewer.setStyle(this._colorStylesMap[range.color], products, group[0].modelId);
                this._viewer.addState(State.XRAYVISIBLE, products, group[0].modelId)
            });
        });
    }

    private renderContinuousChannel(channel: ContinuousHeatmapChannel, sources: HeatmapSource[] = null) {
        // styles for edges of gradient
        channel.colorGradient.forEach(colorHex => {
            if (this._colorStylesMap[colorHex])
                return;

            const rgba = this.hexToRgba(colorHex);
            this._viewer.defineStyle(this._nextStyleId, rgba);
            this._colorStylesMap[colorHex] = this._nextStyleId;
            this._nextStyleId++;
        });

        const maps = (sources ?? this._sources).filter(s => s.channelId == channel.channelId).map(m => {
            const srcValue = Number(m.value);
            if (isNaN(srcValue))
                return null;;
            return {
                map: m,
                clampedValue: this.clamp((srcValue - channel.min) / (channel.max - channel.min), channel.min, channel.max)
            }
        }).filter(m => m != null);
        const ranges = this.groupBy(maps, m => `${m.clampedValue}-${m.map.modelId}`);
        ranges.forEach(group => {
            const value = group[0].clampedValue;
            const modelId = group[0].map.modelId;
            const products: number[] = group.reduce((ps, c) => { ps.push(c.map.productId); return ps; }, []);
            if (this._valueStylesMap[value]) {
                var style = this._valueStylesMap[value];
                this._viewer.setStyle(style, products, modelId);
                this._viewer.addState(State.XRAYVISIBLE, products, modelId)
                return;
            }

            var rgba = this.interpolateColor(channel.colorGradient, value);
            var colorHex = this.rgbaToHex(rgba[0], rgba[1], rgba[2], rgba[3]);

            if (this._colorStylesMap[colorHex]) {
                this._viewer.setStyle(this._colorStylesMap[colorHex], products, modelId);
                this._viewer.addState(State.XRAYVISIBLE, products, modelId)
                return;
            }

            this._viewer.defineStyle(this._nextStyleId, rgba);
            this._colorStylesMap[colorHex] = this._nextStyleId;
            this._valueStylesMap[value] = this._nextStyleId;
            this._viewer.setStyle(this._nextStyleId, products, modelId);
            this._viewer.addState(State.XRAYVISIBLE, products, modelId)
            this._nextStyleId++;
        });
    }

    private interpolateColor(hexColors: string[], t: number): number[] {
        const n = hexColors.length;
        if (n === 0) {
            const msg = 'Color array cannot be empty.';
            console.error(msg);
            throw new Error(msg);
        }
        if (t <= 0) return this.hexToRgba(hexColors[0]);
        if (t >= 1) return this.hexToRgba(hexColors[n - 1]);

        const scaledT = t * (n - 1);
        const startIndex = Math.floor(scaledT);
        const endIndex = Math.ceil(scaledT);
        const segmentT = scaledT - startIndex;

        const startRgb = this.hexToRgba(hexColors[startIndex]);
        const endRgb = this.hexToRgba(hexColors[endIndex]);

        return this.interpolateColorSegment(startRgb, endRgb, segmentT);
    }

    private interpolateColorSegment(startRgb: number[], endRgb: number[], t: number): number[] {
        const r = Math.round(startRgb[0] + (endRgb[0] - startRgb[0]) * t);
        const g = Math.round(startRgb[1] + (endRgb[1] - startRgb[1]) * t);
        const b = Math.round(startRgb[2] + (endRgb[2] - startRgb[2]) * t);
        const a = Math.round(startRgb[3] + (endRgb[3] - startRgb[3]) * t);
        return [r, g, b, a];
    }

    private componentToHex(component: number): string {
        const hex = component.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }

    private rgbaToHex(r: number, g: number, b: number, a: number): string {
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        a = Math.max(0, Math.min(255, a));
        return `#${this.componentToHex(r)}${this.componentToHex(g)}${this.componentToHex(b)}${this.componentToHex(a)}`;
    }

    private hexToRgba(hex: string, alpha: number = 1): number[] {
        hex = hex.replace(/^#/, '');
        let r: number, g: number, b: number, a: number;

        if (hex.length === 3) {
            // Handle shorthand notation (e.g., "#03F")
            r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
            g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
            b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
            a = Math.round(alpha * 255); // Default alpha value
        } else if (hex.length === 6) {
            // Handle full notation (e.g., "#0033FF")
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
            a = Math.round(alpha * 255); // Default alpha value
        } else if (hex.length === 8) {
            // Handle full notation with alpha channel (e.g., "#0033FF80")
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
            a = parseInt(hex.substring(6, 8), 16);
        } else {
            const msg = `Invalid hex color '${hex}'`;
            console.error(msg)
            throw new Error(msg);
        }

        return [r, g, b, a];
    }

    private clamp(value: number, min: number, max: number) {
        return Math.max(min, Math.min(max, value));
    }

    private groupBy<T>(array: Array<T>, keyFunc: (item: T) => string): Array<Array<T>> {
        const seed: { [key: string]: T[] } = {};
        const groups = array.reduce((dictionary, item) => {
            const key = keyFunc(item);
            (dictionary[key] = dictionary[item[key]] || []).push(item);
            return dictionary;
        }, seed);

        const resultSeed: Array<Array<T>> = [];
        return Object.getOwnPropertyNames(groups).reduce((array, key) => { array.push(groups[key]); return array; }, resultSeed);
    };

    public onAfterDraw(width: number, height: number): void {
    }

    public onBeforeDraw(width: number, height: number): void {
    }

    public onBeforeDrawId(): void { }

    public onAfterDrawId(): void { }

    public onAfterDrawModelId(): void { }

}

