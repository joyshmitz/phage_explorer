
let imports = {};
imports['__wbindgen_placeholder__'] = module.exports;

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
function decodeText(ptr, len) {
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

let WASM_VECTOR_LEN = 0;

const BondDetectionResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bonddetectionresult_free(ptr >>> 0, 1));

const CodonUsageResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_codonusageresult_free(ptr >>> 0, 1));

const GridResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gridresult_free(ptr >>> 0, 1));

const HoeffdingResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_hoeffdingresult_free(ptr >>> 0, 1));

const KmerAnalysisResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_kmeranalysisresult_free(ptr >>> 0, 1));

const Model3DFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_model3d_free(ptr >>> 0, 1));

const PCAResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pcaresult_free(ptr >>> 0, 1));

const RepeatResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_repeatresult_free(ptr >>> 0, 1));

const Vector3Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_vector3_free(ptr >>> 0, 1));

/**
 * Result of bond detection
 */
class BondDetectionResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BondDetectionResult.prototype);
        obj.__wbg_ptr = ptr;
        BondDetectionResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BondDetectionResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bonddetectionresult_free(ptr, 0);
    }
    /**
     * Get the number of bonds
     * @returns {number}
     */
    get bond_count() {
        const ret = wasm.bonddetectionresult_bond_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get bonds as flat array [a0, b0, a1, b1, ...]
     * @returns {Uint32Array}
     */
    get bonds() {
        const ret = wasm.bonddetectionresult_bonds(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) BondDetectionResult.prototype[Symbol.dispose] = BondDetectionResult.prototype.free;
exports.BondDetectionResult = BondDetectionResult;

/**
 * Result of codon usage analysis.
 */
class CodonUsageResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(CodonUsageResult.prototype);
        obj.__wbg_ptr = ptr;
        CodonUsageResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CodonUsageResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_codonusageresult_free(ptr, 0);
    }
    /**
     * Get the codon counts as a JSON string.
     * @returns {string}
     */
    get json() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.codonusageresult_json(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) CodonUsageResult.prototype[Symbol.dispose] = CodonUsageResult.prototype.free;
exports.CodonUsageResult = CodonUsageResult;

/**
 * Result of grid building for sequence viewport
 */
class GridResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(GridResult.prototype);
        obj.__wbg_ptr = ptr;
        GridResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GridResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gridresult_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get json() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.gridresult_json(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) GridResult.prototype[Symbol.dispose] = GridResult.prototype.free;
exports.GridResult = GridResult;

/**
 * Result of Hoeffding's D computation
 */
class HoeffdingResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(HoeffdingResult.prototype);
        obj.__wbg_ptr = ptr;
        HoeffdingResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HoeffdingResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_hoeffdingresult_free(ptr, 0);
    }
    /**
     * Hoeffding's D statistic. Range: approximately [-0.5, 1]
     * Values near 0 indicate independence, larger values indicate dependence.
     * Unlike correlation, captures non-linear relationships.
     * @returns {number}
     */
    get d() {
        const ret = wasm.__wbg_get_hoeffdingresult_d(this.__wbg_ptr);
        return ret;
    }
    /**
     * Hoeffding's D statistic. Range: approximately [-0.5, 1]
     * Values near 0 indicate independence, larger values indicate dependence.
     * Unlike correlation, captures non-linear relationships.
     * @param {number} arg0
     */
    set d(arg0) {
        wasm.__wbg_set_hoeffdingresult_d(this.__wbg_ptr, arg0);
    }
    /**
     * Number of observations used
     * @returns {number}
     */
    get n() {
        const ret = wasm.__wbg_get_hoeffdingresult_n(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Number of observations used
     * @param {number} arg0
     */
    set n(arg0) {
        wasm.__wbg_set_hoeffdingresult_n(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) HoeffdingResult.prototype[Symbol.dispose] = HoeffdingResult.prototype.free;
exports.HoeffdingResult = HoeffdingResult;

class KmerAnalysisResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(KmerAnalysisResult.prototype);
        obj.__wbg_ptr = ptr;
        KmerAnalysisResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        KmerAnalysisResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_kmeranalysisresult_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get k() {
        const ret = wasm.__wbg_get_kmeranalysisresult_k(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set k(arg0) {
        wasm.__wbg_set_kmeranalysisresult_k(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get unique_kmers_a() {
        const ret = wasm.__wbg_get_kmeranalysisresult_unique_kmers_a(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set unique_kmers_a(arg0) {
        wasm.__wbg_set_kmeranalysisresult_unique_kmers_a(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get unique_kmers_b() {
        const ret = wasm.__wbg_get_kmeranalysisresult_unique_kmers_b(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set unique_kmers_b(arg0) {
        wasm.__wbg_set_kmeranalysisresult_unique_kmers_b(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get shared_kmers() {
        const ret = wasm.__wbg_get_kmeranalysisresult_shared_kmers(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set shared_kmers(arg0) {
        wasm.__wbg_set_kmeranalysisresult_shared_kmers(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get jaccard_index() {
        const ret = wasm.__wbg_get_hoeffdingresult_d(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set jaccard_index(arg0) {
        wasm.__wbg_set_hoeffdingresult_d(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get containment_a_in_b() {
        const ret = wasm.__wbg_get_kmeranalysisresult_containment_a_in_b(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set containment_a_in_b(arg0) {
        wasm.__wbg_set_kmeranalysisresult_containment_a_in_b(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get containment_b_in_a() {
        const ret = wasm.__wbg_get_kmeranalysisresult_containment_b_in_a(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set containment_b_in_a(arg0) {
        wasm.__wbg_set_kmeranalysisresult_containment_b_in_a(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get cosine_similarity() {
        const ret = wasm.__wbg_get_kmeranalysisresult_cosine_similarity(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set cosine_similarity(arg0) {
        wasm.__wbg_set_kmeranalysisresult_cosine_similarity(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get bray_curtis_dissimilarity() {
        const ret = wasm.__wbg_get_kmeranalysisresult_bray_curtis_dissimilarity(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set bray_curtis_dissimilarity(arg0) {
        wasm.__wbg_set_kmeranalysisresult_bray_curtis_dissimilarity(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) KmerAnalysisResult.prototype[Symbol.dispose] = KmerAnalysisResult.prototype.free;
exports.KmerAnalysisResult = KmerAnalysisResult;

class Model3D {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Model3DFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_model3d_free(ptr, 0);
    }
    /**
     * @param {Float64Array} vertices
     * @param {Uint32Array} edges
     */
    constructor(vertices, edges) {
        const ptr0 = passArrayF64ToWasm0(vertices, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(edges, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.model3d_new(ptr0, len0, ptr1, len1);
        this.__wbg_ptr = ret >>> 0;
        Model3DFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) Model3D.prototype[Symbol.dispose] = Model3D.prototype.free;
exports.Model3D = Model3D;

/**
 * Result of PCA computation
 */
class PCAResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(PCAResult.prototype);
        obj.__wbg_ptr = ptr;
        PCAResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PCAResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pcaresult_free(ptr, 0);
    }
    /**
     * Number of features
     * @returns {number}
     */
    get n_features() {
        const ret = wasm.pcaresult_n_features(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get eigenvalues
     * @returns {Float64Array}
     */
    get eigenvalues() {
        const ret = wasm.pcaresult_eigenvalues(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * Get eigenvectors as flat array (row-major: [pc1_feat1, pc1_feat2, ..., pc2_feat1, ...])
     * @returns {Float64Array}
     */
    get eigenvectors() {
        const ret = wasm.pcaresult_eigenvectors(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * Number of components
     * @returns {number}
     */
    get n_components() {
        const ret = wasm.pcaresult_n_components(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) PCAResult.prototype[Symbol.dispose] = PCAResult.prototype.free;
exports.PCAResult = PCAResult;

/**
 * Result of repeat detection
 */
class RepeatResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(RepeatResult.prototype);
        obj.__wbg_ptr = ptr;
        RepeatResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RepeatResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_repeatresult_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get json() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.repeatresult_json(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) RepeatResult.prototype[Symbol.dispose] = RepeatResult.prototype.free;
exports.RepeatResult = RepeatResult;

class Vector3 {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Vector3Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_vector3_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get x() {
        const ret = wasm.__wbg_get_vector3_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set x(arg0) {
        wasm.__wbg_set_vector3_x(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get y() {
        const ret = wasm.__wbg_get_vector3_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set y(arg0) {
        wasm.__wbg_set_vector3_y(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get z() {
        const ret = wasm.__wbg_get_vector3_z(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set z(arg0) {
        wasm.__wbg_set_vector3_z(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) Vector3.prototype[Symbol.dispose] = Vector3.prototype.free;
exports.Vector3 = Vector3;

/**
 * @param {string} sequence_a
 * @param {string} sequence_b
 * @param {number} k
 * @returns {KmerAnalysisResult}
 */
function analyze_kmers(sequence_a, sequence_b, k) {
    const ptr0 = passStringToWasm0(sequence_a, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(sequence_b, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.analyze_kmers(ptr0, len0, ptr1, len1, k);
    return KmerAnalysisResult.__wrap(ret);
}
exports.analyze_kmers = analyze_kmers;

/**
 * Build a grid of sequence data for viewport rendering.
 *
 * This is the HOT PATH called on every scroll. Optimized for minimal
 * allocations and fast character processing.
 *
 * # Arguments
 * * `seq` - Full sequence string
 * * `start_index` - Starting position in sequence (0-based)
 * * `cols` - Number of columns in grid
 * * `rows` - Number of rows in grid
 * * `mode` - Display mode: "dna", "aa", or "dual"
 * * `frame` - Reading frame for AA translation (0, 1, or 2)
 *
 * # Returns
 * GridResult with JSON-encoded rows, each containing:
 * - cells: array of {char, phase, is_stop, is_start} for DNA mode
 * - cells: array of {char, codon, is_stop, is_start} for AA mode
 * @param {string} seq
 * @param {number} start_index
 * @param {number} cols
 * @param {number} rows
 * @param {string} mode
 * @param {number} frame
 * @returns {GridResult}
 */
function build_grid(seq, start_index, cols, rows, mode, frame) {
    const ptr0 = passStringToWasm0(seq, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.build_grid(ptr0, len0, start_index, cols, rows, ptr1, len1, frame);
    return GridResult.__wrap(ret);
}
exports.build_grid = build_grid;

/**
 * Calculate GC content percentage.
 *
 * Only counts unambiguous A, T, G, C bases. N and other ambiguity codes
 * are excluded from both numerator and denominator.
 *
 * # Arguments
 * * `seq` - DNA sequence string
 *
 * # Returns
 * GC content as percentage (0-100). Returns 0 if no valid bases.
 * @param {string} seq
 * @returns {number}
 */
function calculate_gc_content(seq) {
    const ptr0 = passStringToWasm0(seq, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.calculate_gc_content(ptr0, len0);
    return ret;
}
exports.calculate_gc_content = calculate_gc_content;

/**
 * Compute cumulative GC skew (useful for visualizing replication origin).
 *
 * The cumulative skew will have a minimum at the origin of replication
 * and maximum at the terminus.
 * @param {string} seq
 * @returns {Float64Array}
 */
function compute_cumulative_gc_skew(seq) {
    const ptr0 = passStringToWasm0(seq, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.compute_cumulative_gc_skew(ptr0, len0);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}
exports.compute_cumulative_gc_skew = compute_cumulative_gc_skew;

/**
 * Compute diff mask between two sequences.
 *
 * **STATUS: NOT WIRED IN** - Diff computation happens in JS.
 * Kept for future optimization if diff mode becomes a performance concern.
 * Diff is computed once per sequence change, not per frame, so JS is adequate.
 *
 * Compares a query sequence against a reference sequence and produces
 * a diff mask indicating the type of difference at each position:
 * - 0: Match
 * - 1: Mismatch (substitution)
 * - 2: Insertion (in query relative to ref - not computed here, placeholder)
 * - 3: Deletion (in query relative to ref - not computed here, placeholder)
 *
 * For simple pairwise comparison without alignment, only 0 and 1 are used.
 *
 * # Arguments
 * * `query` - Query sequence (the one being displayed)
 * * `reference` - Reference sequence to compare against
 *
 * # Returns
 * Uint8Array with diff codes (0 = match, 1 = mismatch)
 * @param {string} query
 * @param {string} reference
 * @returns {Uint8Array}
 */
function compute_diff_mask(query, reference) {
    const ptr0 = passStringToWasm0(query, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(reference, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.compute_diff_mask(ptr0, len0, ptr1, len1);
    var v3 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v3;
}
exports.compute_diff_mask = compute_diff_mask;

/**
 * Compute diff mask from pre-encoded sequences (faster than string version).
 *
 * **STATUS: NOT WIRED IN** - See `compute_diff_mask` above.
 * This is the faster variant that operates on pre-encoded sequences.
 *
 * # Arguments
 * * `query_encoded` - Pre-encoded query sequence (values 0-4)
 * * `ref_encoded` - Pre-encoded reference sequence (values 0-4)
 *
 * # Returns
 * Uint8Array with diff codes (0 = match, 1 = mismatch)
 * @param {Uint8Array} query_encoded
 * @param {Uint8Array} ref_encoded
 * @returns {Uint8Array}
 */
function compute_diff_mask_encoded(query_encoded, ref_encoded) {
    const ptr0 = passArray8ToWasm0(query_encoded, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(ref_encoded, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.compute_diff_mask_encoded(ptr0, len0, ptr1, len1);
    var v3 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v3;
}
exports.compute_diff_mask_encoded = compute_diff_mask_encoded;

/**
 * Compute GC skew using a sliding window.
 *
 * GC skew = (G - C) / (G + C)
 *
 * GC skew is used to identify the origin and terminus of replication in
 * bacterial genomes. Positive skew indicates leading strand, negative
 * indicates lagging strand.
 *
 * # Arguments
 * * `seq` - DNA sequence string
 * * `window_size` - Size of sliding window
 * * `step_size` - Step between windows (1 for maximum resolution)
 *
 * # Returns
 * Array of GC skew values for each window position.
 * @param {string} seq
 * @param {number} window_size
 * @param {number} step_size
 * @returns {Float64Array}
 */
function compute_gc_skew(seq, window_size, step_size) {
    const ptr0 = passStringToWasm0(seq, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.compute_gc_skew(ptr0, len0, window_size, step_size);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}
exports.compute_gc_skew = compute_gc_skew;

/**
 * Compute linguistic complexity of a sequence.
 *
 * Linguistic complexity = (number of distinct substrings) / (maximum possible substrings)
 *
 * This measures how "random" or information-rich a sequence is.
 * Low complexity indicates repetitive regions.
 *
 * # Arguments
 * * `seq` - DNA sequence string
 * * `max_k` - Maximum substring length to consider
 *
 * # Returns
 * Complexity score in range [0, 1] where 1 = maximum complexity.
 * @param {string} seq
 * @param {number} max_k
 * @returns {number}
 */
function compute_linguistic_complexity(seq, max_k) {
    const ptr0 = passStringToWasm0(seq, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.compute_linguistic_complexity(ptr0, len0, max_k);
    return ret;
}
exports.compute_linguistic_complexity = compute_linguistic_complexity;

/**
 * Compute color runs for micro batch rendering.
 *
 * **STATUS: NOT WIRED IN** - JS `renderMicroBatch()` is used instead.
 * Kept for future optimization if profiling shows rendering is a bottleneck.
 * The JS version already uses the same single-pass algorithm and achieves 60fps.
 *
 * This performs single-pass run-length encoding on an encoded sequence,
 * producing runs grouped by color. The output is a flat Float32Array where
 * every 4 values represent: [color_code, row_y, x, width].
 *
 * Runs are sorted by color so the JS renderer only needs 5 fillStyle changes.
 *
 * # Arguments
 * * `encoded` - Pre-encoded sequence (values 0-4)
 * * `start_row` - First visible row index
 * * `end_row` - Last visible row index (exclusive)
 * * `cols` - Number of columns per row
 * * `cell_width` - Width of each cell in pixels
 * * `cell_height` - Height of each cell in pixels
 * * `offset_y` - Y offset for first visible row (sub-pixel scrolling)
 * * `start_row_offset` - startRow value from visible range (for row Y calculation)
 *
 * # Returns
 * Float32Array with runs: [color, y, x, width, color, y, x, width, ...]
 * First value is the total number of runs.
 * @param {Uint8Array} encoded
 * @param {number} start_row
 * @param {number} end_row
 * @param {number} cols
 * @param {number} cell_width
 * @param {number} cell_height
 * @param {number} offset_y
 * @param {number} start_row_offset
 * @returns {Float32Array}
 */
function compute_micro_runs(encoded, start_row, end_row, cols, cell_width, cell_height, offset_y, start_row_offset) {
    const ptr0 = passArray8ToWasm0(encoded, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.compute_micro_runs(ptr0, len0, start_row, end_row, cols, cell_width, cell_height, offset_y, start_row_offset);
    var v2 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v2;
}
exports.compute_micro_runs = compute_micro_runs;

/**
 * Compute local complexity in sliding windows.
 *
 * # Arguments
 * * `seq` - DNA sequence string
 * * `window_size` - Size of sliding window
 * * `step_size` - Step between windows
 * * `k` - K-mer size for complexity calculation
 *
 * # Returns
 * Array of complexity values for each window.
 * @param {string} seq
 * @param {number} window_size
 * @param {number} step_size
 * @param {number} k
 * @returns {Float64Array}
 */
function compute_windowed_complexity(seq, window_size, step_size, k) {
    const ptr0 = passStringToWasm0(seq, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.compute_windowed_complexity(ptr0, len0, window_size, step_size, k);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}
exports.compute_windowed_complexity = compute_windowed_complexity;

/**
 * Count codon usage in a DNA sequence.
 *
 * # Arguments
 * * `seq` - DNA sequence string
 * * `frame` - Reading frame (0, 1, or 2)
 *
 * # Returns
 * CodonUsageResult with JSON-encoded codon counts.
 * @param {string} seq
 * @param {number} frame
 * @returns {CodonUsageResult}
 */
function count_codon_usage(seq, frame) {
    const ptr0 = passStringToWasm0(seq, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.count_codon_usage(ptr0, len0, frame);
    return CodonUsageResult.__wrap(ret);
}
exports.count_codon_usage = count_codon_usage;

/**
 * Detect bonds using spatial hashing for O(N) complexity.
 *
 * This is the CRITICAL optimization replacing the O(N²) algorithm.
 * For a 50,000 atom structure:
 * - Old: 1.25 billion comparisons → 30-60+ seconds
 * - New: ~1 million comparisons → <1 second
 *
 * # Arguments
 * * `positions` - Flat array of atom positions [x0, y0, z0, x1, y1, z1, ...]
 * * `elements` - String of element symbols (one char per atom: "CCCCNNO...")
 *
 * # Returns
 * BondDetectionResult with pairs of bonded atom indices.
 *
 * # Algorithm
 * 1. Build spatial hash with cell size = max bond distance (~2.7Å)
 * 2. For each atom, only check atoms in neighboring 27 cells
 * 3. Reduces O(N²) to O(N * k) where k ≈ 20 atoms per neighborhood
 * @param {Float32Array} positions
 * @param {string} elements
 * @returns {BondDetectionResult}
 */
function detect_bonds_spatial(positions, elements) {
    const ptr0 = passArrayF32ToWasm0(positions, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(elements, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.detect_bonds_spatial(ptr0, len0, ptr1, len1);
    return BondDetectionResult.__wrap(ret);
}
exports.detect_bonds_spatial = detect_bonds_spatial;

/**
 * Detect palindromic (inverted repeat) sequences in DNA.
 *
 * A palindrome in DNA is a sequence that reads the same on the complementary
 * strand in reverse (e.g., GAATTC and its complement CTTAAG reversed).
 *
 * # Arguments
 * * `seq` - DNA sequence string
 * * `min_len` - Minimum palindrome arm length (typically 4-6)
 * * `max_gap` - Maximum gap/spacer between palindrome arms (0 for perfect palindromes)
 *
 * # Returns
 * RepeatResult with JSON array of {start, end, arm_length, gap, sequence}
 * @param {string} seq
 * @param {number} min_len
 * @param {number} max_gap
 * @returns {RepeatResult}
 */
function detect_palindromes(seq, min_len, max_gap) {
    const ptr0 = passStringToWasm0(seq, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.detect_palindromes(ptr0, len0, min_len, max_gap);
    return RepeatResult.__wrap(ret);
}
exports.detect_palindromes = detect_palindromes;

/**
 * Detect tandem repeats (consecutive copies of a pattern).
 *
 * # Arguments
 * * `seq` - DNA sequence string
 * * `min_unit` - Minimum repeat unit length
 * * `max_unit` - Maximum repeat unit length
 * * `min_copies` - Minimum number of consecutive copies
 *
 * # Returns
 * RepeatResult with JSON array of {start, end, unit, copies, sequence}
 * @param {string} seq
 * @param {number} min_unit
 * @param {number} max_unit
 * @param {number} min_copies
 * @returns {RepeatResult}
 */
function detect_tandem_repeats(seq, min_unit, max_unit, min_copies) {
    const ptr0 = passStringToWasm0(seq, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.detect_tandem_repeats(ptr0, len0, min_unit, max_unit, min_copies);
    return RepeatResult.__wrap(ret);
}
exports.detect_tandem_repeats = detect_tandem_repeats;

/**
 * Fast sequence encoding for canvas rendering.
 *
 * **STATUS: NOT WIRED IN** - JS `encodeSequence()` is used instead.
 * Kept for future optimization if profiling shows encoding is a bottleneck.
 *
 * Encodes nucleotide characters to numeric codes:
 * - A/a -> 0, C/c -> 1, G/g -> 2, T/t/U/u -> 3, other -> 4 (N)
 *
 * This would be used by CanvasSequenceGridRenderer for O(1) lookups during rendering.
 * WASM version is ~4x faster than JS for large sequences due to tighter loops,
 * but encoding only happens once per sequence change (not per frame).
 *
 * # Arguments
 * * `seq` - DNA/RNA sequence string
 *
 * # Returns
 * Uint8Array with encoded values (0-4)
 * @param {string} seq
 * @returns {Uint8Array}
 */
function encode_sequence_fast(seq) {
    const ptr0 = passStringToWasm0(seq, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.encode_sequence_fast(ptr0, len0);
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}
exports.encode_sequence_fast = encode_sequence_fast;

/**
 * Compute Hoeffding's D statistic for measuring statistical dependence.
 *
 * Hoeffding's D is a non-parametric measure of association that can detect
 * any type of dependence (linear or non-linear) between two variables.
 * Unlike Pearson correlation (linear only) or Spearman/Kendall (monotonic),
 * Hoeffding's D can detect complex non-monotonic relationships.
 *
 * # Arguments
 * * `x` - First vector of observations (as a JS Float64Array)
 * * `y` - Second vector of observations (must have same length as x)
 *
 * # Returns
 * HoeffdingResult containing the D statistic and sample size.
 * D ranges approximately from -0.5 to 1, where:
 * - D ≈ 0: variables are independent
 * - D > 0: variables are dependent
 * - D = 1: perfect dependence
 *
 * # Performance
 * O(n²) time complexity. For very large vectors (n > 10000), consider
 * sampling or using approximate methods.
 *
 * # Example Use Cases for Genome Analysis
 * - Compare k-mer frequency vectors between genomes
 * - Detect non-linear relationships in GC content distributions
 * - Measure codon usage similarity accounting for complex dependencies
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @returns {HoeffdingResult}
 */
function hoeffdings_d(x, y) {
    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.hoeffdings_d(ptr0, len0, ptr1, len1);
    return HoeffdingResult.__wrap(ret);
}
exports.hoeffdings_d = hoeffdings_d;

function init_panic_hook() {
    wasm.init_panic_hook();
}
exports.init_panic_hook = init_panic_hook;

/**
 * Compute Jensen-Shannon Divergence between two probability distributions.
 *
 * JSD(P || Q) = 0.5 * KL(P || M) + 0.5 * KL(Q || M)
 * where M = 0.5 * (P + Q)
 *
 * This is a symmetric and bounded (0 to 1 when using log2) divergence measure.
 *
 * # Arguments
 * * `p` - First probability distribution
 * * `q` - Second probability distribution (must have same length as p)
 *
 * # Returns
 * JSD value in range [0, 1]. Returns 0 if inputs are identical, 1 if completely different.
 * @param {Float64Array} p
 * @param {Float64Array} q
 * @returns {number}
 */
function jensen_shannon_divergence(p, q) {
    const ptr0 = passArrayF64ToWasm0(p, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(q, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.jensen_shannon_divergence(ptr0, len0, ptr1, len1);
    return ret;
}
exports.jensen_shannon_divergence = jensen_shannon_divergence;

/**
 * Compute JSD between two count arrays.
 * Normalizes to probabilities internally.
 * @param {Float64Array} counts_a
 * @param {Float64Array} counts_b
 * @returns {number}
 */
function jensen_shannon_divergence_from_counts(counts_a, counts_b) {
    const ptr0 = passArrayF64ToWasm0(counts_a, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(counts_b, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.jensen_shannon_divergence_from_counts(ptr0, len0, ptr1, len1);
    return ret;
}
exports.jensen_shannon_divergence_from_counts = jensen_shannon_divergence_from_counts;

/**
 * Compute Hoeffding's D between two k-mer frequency vectors derived from sequences.
 *
 * This is a convenience function that:
 * 1. Extracts k-mer frequencies from both sequences
 * 2. Creates aligned frequency vectors for all unique k-mers
 * 3. Computes Hoeffding's D on the frequency vectors
 *
 * # Arguments
 * * `sequence_a` - First DNA sequence
 * * `sequence_b` - Second DNA sequence
 * * `k` - K-mer size (typically 3-7 for genome comparison)
 *
 * # Returns
 * Hoeffding's D statistic measuring dependence between k-mer frequency profiles.
 * Higher values indicate more similar frequency patterns (non-linear similarity).
 * @param {string} sequence_a
 * @param {string} sequence_b
 * @param {number} k
 * @returns {HoeffdingResult}
 */
function kmer_hoeffdings_d(sequence_a, sequence_b, k) {
    const ptr0 = passStringToWasm0(sequence_a, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(sequence_b, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.kmer_hoeffdings_d(ptr0, len0, ptr1, len1, k);
    return HoeffdingResult.__wrap(ret);
}
exports.kmer_hoeffdings_d = kmer_hoeffdings_d;

/**
 * @param {string} s1
 * @param {string} s2
 * @returns {number}
 */
function levenshtein_distance(s1, s2) {
    const ptr0 = passStringToWasm0(s1, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(s2, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.levenshtein_distance(ptr0, len0, ptr1, len1);
    return ret >>> 0;
}
exports.levenshtein_distance = levenshtein_distance;

/**
 * @param {string} sequence_a
 * @param {string} sequence_b
 * @param {number} k
 * @param {number} num_hashes
 * @returns {number}
 */
function min_hash_jaccard(sequence_a, sequence_b, k, num_hashes) {
    const ptr0 = passStringToWasm0(sequence_a, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(sequence_b, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.min_hash_jaccard(ptr0, len0, ptr1, len1, k, num_hashes);
    return ret;
}
exports.min_hash_jaccard = min_hash_jaccard;

/**
 * Compute PCA using power iteration method.
 *
 * # Arguments
 * * `data` - Flattened row-major matrix (n_samples * n_features)
 * * `n_samples` - Number of samples (rows)
 * * `n_features` - Number of features (columns)
 * * `n_components` - Number of principal components to extract
 * * `max_iterations` - Maximum iterations for power iteration (default: 100)
 * * `tolerance` - Convergence tolerance (default: 1e-8)
 *
 * # Returns
 * PCAResult containing eigenvectors and eigenvalues.
 *
 * # Algorithm
 * Uses power iteration to find top eigenvectors of X^T * X without forming
 * the full covariance matrix. This is memory-efficient for high-dimensional
 * data (e.g., k-mer frequencies with 4^k features).
 * @param {Float64Array} data
 * @param {number} n_samples
 * @param {number} n_features
 * @param {number} n_components
 * @param {number} max_iterations
 * @param {number} tolerance
 * @returns {PCAResult}
 */
function pca_power_iteration(data, n_samples, n_features, n_components, max_iterations, tolerance) {
    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.pca_power_iteration(ptr0, len0, n_samples, n_features, n_components, max_iterations, tolerance);
    return PCAResult.__wrap(ret);
}
exports.pca_power_iteration = pca_power_iteration;

/**
 * Renders a 3D model to an ASCII string.
 *
 * # Arguments
 * * `model` - The 3D model to render (vertices and edges).
 * * `rx` - Rotation around X axis (radians).
 * * `ry` - Rotation around Y axis (radians).
 * * `rz` - Rotation around Z axis (radians).
 * * `width` - Target width of the ASCII canvas in characters.
 * * `height` - Target height of the ASCII canvas in characters.
 * * `quality` - Rendering quality/style ("low", "medium", "high", "ultra", "blocks").
 * @param {Model3D} model
 * @param {number} rx
 * @param {number} ry
 * @param {number} rz
 * @param {number} width
 * @param {number} height
 * @param {string} quality
 * @returns {string}
 */
function render_ascii_model(model, rx, ry, rz, width, height, quality) {
    let deferred2_0;
    let deferred2_1;
    try {
        _assertClass(model, Model3D);
        const ptr0 = passStringToWasm0(quality, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.render_ascii_model(model.__wbg_ptr, rx, ry, rz, width, height, ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}
exports.render_ascii_model = render_ascii_model;

/**
 * Compute reverse complement of DNA sequence.
 *
 * Handles all IUPAC ambiguity codes correctly:
 * - Standard: A<->T, G<->C
 * - Ambiguity: R<->Y, K<->M, S<->S, W<->W, B<->V, D<->H, N<->N
 *
 * # Arguments
 * * `seq` - DNA sequence string
 *
 * # Returns
 * Reverse complement sequence (preserving case).
 * @param {string} seq
 * @returns {string}
 */
function reverse_complement(seq) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(seq, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.reverse_complement(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}
exports.reverse_complement = reverse_complement;

/**
 * Compute Shannon entropy from a probability distribution.
 *
 * H(X) = -Σ p(x) * log2(p(x))
 *
 * # Arguments
 * * `probs` - Probability distribution (must sum to ~1.0)
 *
 * # Returns
 * Shannon entropy in bits. Returns 0 for empty or invalid input.
 * @param {Float64Array} probs
 * @returns {number}
 */
function shannon_entropy(probs) {
    const ptr0 = passArrayF64ToWasm0(probs, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.shannon_entropy(ptr0, len0);
    return ret;
}
exports.shannon_entropy = shannon_entropy;

/**
 * Compute Shannon entropy from a frequency count array.
 * Converts counts to probabilities internally.
 *
 * # Arguments
 * * `counts` - Array of frequency counts
 *
 * # Returns
 * Shannon entropy in bits.
 * @param {Float64Array} counts
 * @returns {number}
 */
function shannon_entropy_from_counts(counts) {
    const ptr0 = passArrayF64ToWasm0(counts, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.shannon_entropy_from_counts(ptr0, len0);
    return ret;
}
exports.shannon_entropy_from_counts = shannon_entropy_from_counts;

/**
 * Translate DNA sequence to amino acid sequence.
 *
 * # Arguments
 * * `seq` - DNA sequence string
 * * `frame` - Reading frame (0, 1, or 2)
 *
 * # Returns
 * Amino acid sequence as a string. Unknown codons (containing N) become 'X'.
 * @param {string} seq
 * @param {number} frame
 * @returns {string}
 */
function translate_sequence(seq, frame) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(seq, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.translate_sequence(ptr0, len0, frame);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}
exports.translate_sequence = translate_sequence;

exports.__wbg___wbindgen_throw_dd24417ed36fc46e = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

exports.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

exports.__wbg_new_8a6f238a6ece86ea = function() {
    const ret = new Error();
    return ret;
};

exports.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
    const ret = arg1.stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

exports.__wbindgen_init_externref_table = function() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
};

// Inlined Wasm bytes
const wasmBase64 = "AGFzbQEAAAAB+AEiYAJ/fwBgAn9/AX9gAAJ/f2ADf39/AX9gA39/fwBgAX8AYAF/AX9gBH9/f38Bf2AAAGAEf39/fwBgAn98AGAFf39/f38AYAF8AXxgBX9/f39/AX9gAX8BfGABfwJ/f2AGf39/f39/AGACf38BfmACf38BfGAEf39/fwJ/f2ACf38Cf39gB39/f39/f38AYAR/f39/AXxgAAFvYAJ/bwBgB39/f39/f3wBf2AIf39/f39/f38Bf2AGf39/f39/AXxgCX9/f39/fX19fwJ/f2AIf3x8fH9/f38Cf39gBX9/f39/An9/YAN/f38Cf39gA39/fwF8YAABfwKlAgUYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fGl9fd2JnX25ld184YTZmMjM4YTZlY2U4NmVhABcYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fHF9fd2JnX3N0YWNrXzBlZDc1ZDY4NTc1YjBmM2MAGBhfX3diaW5kZ2VuX3BsYWNlaG9sZGVyX18cX193YmdfZXJyb3JfNzUzNGI4ZTlhMzZmMWFiNAAAGF9fd2JpbmRnZW5fcGxhY2Vob2xkZXJfXydfX3diZ19fX3diaW5kZ2VuX3Rocm93X2RkMjQ0MTdlZDM2ZmM0NmUAABhfX3diaW5kZ2VuX3BsYWNlaG9sZGVyX18fX193YmluZGdlbl9pbml0X2V4dGVybnJlZl90YWJsZQAIA74BvAEGBBUVEAkQCwoEBAkDBQQEBAsJBAMMDAcRAQAEEREABwQSBA0AARIABAwNAAEBAQEHABYSAAADAAALEAsAAAANGQQBGgkABwQEBw0ICQ0HAwUFBQUFBQsMAAQGBgYDAwMDBQUBCAUACRYEARsBBxwHBx0GHhMTEx8OBg4ODg4GBgYGFBQUCgAKCgoKAAAAAA8PDw8gBQUEAQghBQwAAAAEBAMBAQEHAAEBBAMDAwgBAQEACAgAAAEBAwAFAAQJAnABKChvAIABBQMBABEGCQF/AUGAgMAACwesElEGbWVtb3J5AgAeX193YmdfYm9uZGRldGVjdGlvbnJlc3VsdF9mcmVlADwbX193YmdfY29kb251c2FnZXJlc3VsdF9mcmVlAD0bX193YmdfZ2V0X2hvZWZmZGluZ3Jlc3VsdF9kAH0bX193YmdfZ2V0X2hvZWZmZGluZ3Jlc3VsdF9uAH42X193YmdfZ2V0X2ttZXJhbmFseXNpc3Jlc3VsdF9icmF5X2N1cnRpc19kaXNzaW1pbGFyaXR5AH8vX193YmdfZ2V0X2ttZXJhbmFseXNpc3Jlc3VsdF9jb250YWlubWVudF9hX2luX2IAgAEvX193YmdfZ2V0X2ttZXJhbmFseXNpc3Jlc3VsdF9jb250YWlubWVudF9iX2luX2EAgQEuX193YmdfZ2V0X2ttZXJhbmFseXNpc3Jlc3VsdF9jb3NpbmVfc2ltaWxhcml0eQCCAR5fX3diZ19nZXRfa21lcmFuYWx5c2lzcmVzdWx0X2sAgwEpX193YmdfZ2V0X2ttZXJhbmFseXNpc3Jlc3VsdF9zaGFyZWRfa21lcnMAhAErX193YmdfZ2V0X2ttZXJhbmFseXNpc3Jlc3VsdF91bmlxdWVfa21lcnNfYQCFAStfX3diZ19nZXRfa21lcmFuYWx5c2lzcmVzdWx0X3VuaXF1ZV9rbWVyc19iAIYBFV9fd2JnX2dyaWRyZXN1bHRfZnJlZQA9Gl9fd2JnX2hvZWZmZGluZ3Jlc3VsdF9mcmVlAEEdX193Ymdfa21lcmFuYWx5c2lzcmVzdWx0X2ZyZWUAQhRfX3diZ19wY2FyZXN1bHRfZnJlZQA5F19fd2JnX3JlcGVhdHJlc3VsdF9mcmVlAD0bX193Ymdfc2V0X2hvZWZmZGluZ3Jlc3VsdF9kAIoBG19fd2JnX3NldF9ob2VmZmRpbmdyZXN1bHRfbgCLATZfX3diZ19zZXRfa21lcmFuYWx5c2lzcmVzdWx0X2JyYXlfY3VydGlzX2Rpc3NpbWlsYXJpdHkAjAEvX193Ymdfc2V0X2ttZXJhbmFseXNpc3Jlc3VsdF9jb250YWlubWVudF9hX2luX2IAjQEvX193Ymdfc2V0X2ttZXJhbmFseXNpc3Jlc3VsdF9jb250YWlubWVudF9iX2luX2EAjgEuX193Ymdfc2V0X2ttZXJhbmFseXNpc3Jlc3VsdF9jb3NpbmVfc2ltaWxhcml0eQCPAR5fX3diZ19zZXRfa21lcmFuYWx5c2lzcmVzdWx0X2sAkAEpX193Ymdfc2V0X2ttZXJhbmFseXNpc3Jlc3VsdF9zaGFyZWRfa21lcnMAkQErX193Ymdfc2V0X2ttZXJhbmFseXNpc3Jlc3VsdF91bmlxdWVfa21lcnNfYQCSAStfX3diZ19zZXRfa21lcmFuYWx5c2lzcmVzdWx0X3VuaXF1ZV9rbWVyc19iAJMBDWFuYWx5emVfa21lcnMAKB5ib25kZGV0ZWN0aW9ucmVzdWx0X2JvbmRfY291bnQAXxlib25kZGV0ZWN0aW9ucmVzdWx0X2JvbmRzAJUBCmJ1aWxkX2dyaWQASBRjYWxjdWxhdGVfZ2NfY29udGVudAArFWNvZG9udXNhZ2VyZXN1bHRfanNvbgCUARpjb21wdXRlX2N1bXVsYXRpdmVfZ2Nfc2tldwCHARFjb21wdXRlX2RpZmZfbWFzawB6GWNvbXB1dGVfZGlmZl9tYXNrX2VuY29kZWQAew9jb21wdXRlX2djX3NrZXcAeR1jb21wdXRlX2xpbmd1aXN0aWNfY29tcGxleGl0eQCYARJjb21wdXRlX21pY3JvX3J1bnMAcxtjb21wdXRlX3dpbmRvd2VkX2NvbXBsZXhpdHkAeBFjb3VudF9jb2Rvbl91c2FnZQBUFGRldGVjdF9ib25kc19zcGF0aWFsAE4SZGV0ZWN0X3BhbGluZHJvbWVzAFMVZGV0ZWN0X3RhbmRlbV9yZXBlYXRzAFIUZW5jb2RlX3NlcXVlbmNlX2Zhc3QAiAEPZ3JpZHJlc3VsdF9qc29uAJQBDGhvZWZmZGluZ3NfZABLGWplbnNlbl9zaGFubm9uX2RpdmVyZ2VuY2UANyVqZW5zZW5fc2hhbm5vbl9kaXZlcmdlbmNlX2Zyb21fY291bnRzAG0Ra21lcl9ob2VmZmRpbmdzX2QATxRsZXZlbnNodGVpbl9kaXN0YW5jZQB0EG1pbl9oYXNoX2phY2NhcmQAcBNwY2FfcG93ZXJfaXRlcmF0aW9uAEUVcGNhcmVzdWx0X2VpZ2VudmFsdWVzAJYBFnBjYXJlc3VsdF9laWdlbnZlY3RvcnMAlwEWcGNhcmVzdWx0X25fY29tcG9uZW50cwBgFHBjYXJlc3VsdF9uX2ZlYXR1cmVzAGERcmVwZWF0cmVzdWx0X2pzb24AlAEScmV2ZXJzZV9jb21wbGVtZW50AIkBD3NoYW5ub25fZW50cm9weQA4G3NoYW5ub25fZW50cm9weV9mcm9tX2NvdW50cwAmEnRyYW5zbGF0ZV9zZXF1ZW5jZQB8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IgVHDQALCwRAIBEgCiAFQQN0IgFqKwMARAAAAAAAAPC/oCABIAlqKwMARAAAAAAAAPC/oKIgASALaisDAEQAAAAAAADwv6CioCERCyAAIAI2AgggACAXIAJBAWu4oiACQQJruCISoiACQQNruCIToiACQQRruKIiFJlEu73X2d982z1kBHwgEiAToiAPoiAQoCASIBKgIBGioUQAAAAAAAA+QKIgFKMFRAAAAAAAAAAACzkDACALIA1BCBCuASAIKAIUIgAEQCAJIABBA3RBCBCuAQsgCCgCCCIARQ0AIAogAEEDdEEIEK4BCyAIQSBqJAAL+CcDHn8EfAF+IwBBMGsiCSQAAkACQCABvSIkQiCIpyICQf////8HcSIEQfvUvYAETwRAIARBvIzxgARPBEACQAJAIARB+8PkiQRPBEAgBEH//7//B0sNASAJICRC/////////weDQoCAgICAgICwwQCEvyIB/AK3IiA5AwAgCSABICChRAAAAAAAAHBBoiIB/AIiArciIDkDCCAJIAEgIKFEAAAAAAAAcEGiIgE5AxAgCUIANwMoIAlCADcDICAJQgA3AxggCUEYaiESIwBBsARrIgMkACADQgA3A5gBIANCADcDkAEgA0IANwOIASADQgA3A4ABIANCADcDeCADQgA3A3AgA0IANwNoIANCADcDYCADQgA3A1ggA0IANwNQIANCADcDSCADQgA3A0AgA0IANwM4IANCADcDMCADQgA3AyggA0IANwMgIANCADcDGCADQgA3AxAgA0IANwMIIANCADcDACADQgA3A7gCIANCADcDsAIgA0IANwOoAiADQgA3A6ACIANCADcDmAIgA0IANwOQAiADQgA3A4gCIANCADcDgAIgA0IANwP4ASADQgA3A/ABIANCADcD6AEgA0IANwPgASADQgA3A9gBIANCADcD0AEgA0IANwPIASADQgA3A8ABIANCADcDuAEgA0IANwOwASADQgA3A6gBIANCADcDoAEgA0IANwPYAyADQgA3A9ADIANCADcDyAMgA0IANwPAAyADQgA3A7gDIANCADcDsAMgA0IANwOoAyADQgA3A6ADIANCADcDmAMgA0IANwOQAyADQgA3A4gDIANCADcDgAMgA0IANwP4AiADQgA3A/ACIANCADcD6AIgA0IANwPgAiADQgA3A9gCIANC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AEHAmsAAIAAbKAIAuDkDACAGQQFqIQYgAUEBaiIBIBBHDQALCyAGNgIAC+cCAQV/AkAgAUHN/3tBECAAIABBEE0bIgBrTw0AIABBECABQQtqQXhxIAFBC0kbIgRqQQxqEAUiAkUNACACQQhrIQECQCAAQQFrIgMgAnFFBEAgASEADAELIAJBBGsiBSgCACIGQXhxIAIgA2pBACAAa3FBCGsiAiAAQQAgAiABa0EQTRtqIgAgAWsiAmshAyAGQQNxBEAgACADIAAoAgRBAXFyQQJyNgIEIAAgA2oiAyADKAIEQQFyNgIEIAUgAiAFKAIAQQFxckECcjYCACABIAJqIgMgAygCBEEBcjYCBCABIAIQIwwBCyABKAIAIQEgACADNgIEIAAgASACajYCAAsCQCAAKAIEIgFBA3FFDQAgAUF4cSICIARBEGpNDQAgACAEIAFBAXFyQQJyNgIEIAAgBGoiASACIARrIgRBA3I2AgQgACACaiICIAIoAgRBAXI2AgQgASAEECMLIABBCGohAwsgAwuCBQICfgN/IAFFBEBEAAAAAAAAAAAPCyABQQNxIQUCfyABQQRJBEAgAAwBCyABQfz///8HcSEGIAAhBANAAkACQAJAIAQtAABBwQBrDjUBAgACAgIAAgICAgICAgICAgICAQECAgICAgICAgICAgECAAICAgACAgICAgICAgICAgIBAQILIAJCAXwhAiADQgF8IQMMAQsgAkIBfCECCwJAAkACQCAEQQFqLQAAQcEAaw41AQIAAgICAAICAgICAgICAgICAgEBAgICAgICAgICAgIBAgACAgIAAgICAgICAgICAgICAQECCyACQgF8IQIgA0IBfCEDDAELIAJCAXwhAgsCQAJAAkAgBEECai0AAEHBAGsONQACAQICAgECAgICAgICAgICAgIAAAICAgICAgICAgICAAIBAgICAQICAgICAgICAgICAgAAAgsgAkIBfCECDAELIAJCAXwhAiADQgF8IQMLAkACQAJAIARBA2otAABBwQBrDjUAAgECAgIBAgICAgICAgICAgICAAACAgICAgICAgICAgACAQICAgECAgICAgICAgICAgIAAAILIAJCAXwhAgwBCyACQgF8IQIgA0IBfCEDCyAEQQRqIQQgBkEEayIGDQALIAQLIQQgBQRAA0ACQAJAAkAgBC0A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AAJAIAAEQCAAKAIARQ0BELgBAAsQtwEACyAAIAE5AwgLIQACQCAABEAgACgCAEUNARC4AQALELcBAAsgACABNgIQCyEAAkAgAARAIAAoAgBFDQEQuAEACxC3AQALIAAgATkDKAshAAJAIAAEQCAAKAIARQ0BELgBAAsQtwEACyAAIAE5AxALIQACQCAABEAgACgCAEUNARC4AQALELcBAAsgACABOQMYCyEAAkAgAARAIAAoAgBFDQEQuAEACxC3AQALIAAgATkDIAshAAJAIAAEQCAAKAIARQ0BELgBAAsQtwEACyAAIAE2AjALIQACQCAABEAgACgCAEUNARC4AQALELcBAAsgACABNgI8CyEAAkAgAARAIAAoAgBFDQEQuAEACxC3AQALIAAgATYCNAshAAJAIAAEQCAAKAIARQ0BELgBAAsQtwEACyAAIAE2AjgL/QIBB38jAEEQayIFJAAjAEEgayICJAACQAJAAkACQCAABEAgAEEIayIDIAMoAgBBAWoiATYCACABRQ0BIAAoAgAiAUF/Rg0CIAAgAUEBajYCACACIAM2AhAgAiAANgIMIAIgAEEEaiIBNgIIIAJBFGohBCABKAIEIQcCQAJAAkAgASgCCCIBRQRAQQEhBgwBCyABQQEQswEiBkUNAQsgAQRAIAYgByAB/AoAAAsgBCABNgIIIAQgBjYCBCAEIAE2AgAMAQtBASABEKMBAAsgACAAKAIAQQFrNgIAIAMgAygCAEEBayIANgIAIABFBEAgAkEQahBnCwJAIAIoAhQiAyACKAIcIgBNBEAgAigCGCEBDAELIAIoAhghBCAARQRAQQEhASAEIANBARCuAQwBCyAEIANBASAAEKoBIgFFDQQLIAUgADYCBCAFIAE2AgAgAkEgaiQADAQLELcBCwALELgBAAtBASAAEKMBAAsgBSgCACAFKAIEIAVBEGokAAulAgEIfyMAQRBrIgIkACMAQRBrIgMkAAJAAkACQAJAIAAEQCAAQQhrIgQgBCgCAEEBaiIBNgIAIAFFDQEgACgCACIBQX9GDQIgACABQQFqNgIAIAMgBDYCDCADIAA2AgggAyAAQQRqNgIEIAAoAgwiB0ECdCEBIAdB/////wNLIAFB/P///wdLcg0DIAAoAgghCAJAIAFFBEBBBCEFDAELQQQhBiABQQQQswEiBUUNBAsgAQRAIAUgCCAB/AoAAAsgACAAKAIAQQFrNgIAIAQgBCgCAEEBayIANgIAIABFBEAgA0EMahBmCyACIAc2AgQgAiAFNgIAIANBEGokAAwECxC3AQsACxC4AQALIAYgARCjAQALIAIoAgAgAigCBCACQRBqJAALpQIBCH8jAEEQayICJAAjAEEQayIDJAACQAJAAkACQCAABEAgAEEIayIEIAQoAgBBAWoiATYCACABRQ0BIAAoAgAiAUF/Rg0CIAAgAUEBajYCACADIAQ2AgwgAyAANgIIIAMgAEEEajYCBCAAKAIYIgdBA3QhASAHQf////8BSyABQfj///8HS3INAyAAKAIUIQgCQCABRQRAQQghBQwBC0EIIQYgAUEIELMBIgVFDQQLIAEEQCAFIAggAfwKAAALIAAgACgCAEEBazYCACAEIAQoAgBBAWsiADYCACAARQRAIANBDGoQWQsgAiAHNgIEIAIgBTYCACADQRBqJAAMBAsQtwELAAsQuAEACyAGIAEQowEACyACKAIAIAIoAgQgAkEQaiQAC6UCAQh/IwBBEGsiAiQAIwBBEGsiAyQAAkACQAJAAkAgAARAIABBCGsiBCAEKAIAQQFqIgE2AgAgAUUNASAAKAIAIgFBf0YNAiAAIAFBAWo2AgAgAyAENgIMIAMgADYCCCADIABBBGo2AgQgACgCDCIHQQN0IQEgB0H/////AUsgAUH4////B0tyDQMgACgCCCEIAkAgAUUEQEEIIQUMAQtBCCEGIAFBCBCzASIFRQ0ECyABBEAgBSAIIAH8CgAACyAAIAAoAgBBAWs2AgAgBCAEKAIAQQFrIgA2AgAgAEUEQCADQQxqEFkLIAIgBzYCBCACIAU2AgAgA0EQaiQADAQLELcBCwALELgBAAsgBiABEKMBAAsgAigCACACKAIEIAJBEGokAAuXAwMEfgd/AXwjAEEgayIHJAACQCABRSACRXINACABIAIgASACSRshCyABQQFqIQwgB0EIaiENQQEhCANAQQAhAhCeASIJIAkpAwAiA0IBfDcDACAJKQMIIQQgDUHYmsAAKQMANwMAIAdB0JrAACkDADcDACAHIAQ3AxggByADNwMQIAEgCGshCQNAIAIgAiAIaiIKTSABIApPcUUEQCACIAogAUHglMAAEGwACyAHIAAgAmogCBAgIAIgCUkiCgRA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ImVuZCI6wAosImNlbGxzIjpbwAJdfQAJeyJzdGFydCI6wAcsImVuZCI6wAksInVuaXQiOiLACyIsImNvcGllcyI6wA0sInNlcXVlbmNlIjoiwAIifQAJeyJzdGFydCI6wAcsImVuZCI6wA4sImFybV9sZW5ndGgiOsAHLCJnYXAiOsANLCJzZXF1ZW5jZSI6IsACIn0ACXsiY2hhciI6IsALIiwiY29kb24iOiLACCIsInBvcyI6wAssImlzX3N0b3AiOsAMLCJpc19zdGFydCI6wAF9AAl7ImNoYXIiOiLACCIsInBvcyI6wAksInBoYXNlIjrACywiaXNfc3RvcCI6wAwsImlzX3N0YXJ0IjrAAX0AbGlicmFyeS9jb3JlL3NyYy9zbGljZS9zb3J0L3NoYXJlZC9zbWFsbHNvcnQucnMAL3J1c3RjLzM3YWEyMTM1YjVkMDkzNmJkMTNhYTY5OWQ5NDFhYWE5NGZiYWE2NDUvbGlicmFyeS9jb3JlL3NyYy9zbGljZS9zb3J0L3N0YWJsZS9xdWlja3NvcnQucnMAbGlicmFyeS9hbGxvYy9zcmMvZm10LnJzAC9ydXN0Yy8zN2FhMjEzNWI1ZDA5MzZiZDEzYWE2OTlkOTQxYWFhOTRmYmFhNjQ1L2xpYnJhcnkvc3RkL3NyYy9zeXMvdGhyZWFkX2xvY2FsL25vX3RocmVhZHMucnMAL3J1c3RjLzM3YWEyMTM1YjVkMDkzNmJkMTNhYTY5OWQ5NDFhYWE5NGZiYWE2NDUvbGlicmFyeS9hbGxvYy9zcmMvc3RyLnJzAHNyYy9yZW5kZXJlci5ycwBsaWJyYXJ5L2NvcmUvc3JjL2ZtdC9udW0ucnMAL3J1c3RjLzM3YWEyMTM1YjVkMDkzNmJkMTNhYTY5OWQ5NDFhYWE5NGZiYWE2NDUvbGlicmFyeS9hbGxvYy9zcmMvc3RyaW5nLnJzAGxpYnJhcnkvc3RkL3NyYy9wYW5pY2tpbmcucnMAL2hvbWUvdWJ1bnR1Ly5jYXJnby9yZWdpc3RyeS9zcmMvaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2Yvd2FzbS1iaW5kZ2VuLTAuMi4xMDYvc3JjL2V4dGVybnJlZi5ycwAvcnVzdGMvMzdhYTIxMzViNWQwOTM2YmQxM2FhNjk5ZDk0MWFhYTk0ZmJhYTY0NS9saWJyYXJ5L3N0ZC9zcmMvc3luYy9vbmNlLnJzAC9ydXN0L2RlcHMvaGFzaGJyb3duLTAuMTYuMS9zcmMvcmF3L21vZC5ycwBsaWJyYXJ5L2FsbG9jL3NyYy9yYXdfdmVjL21vZC5ycwAvcnVzdGMvMzdhYTIxMzViNWQwOTM2YmQxM2FhNjk5ZDk0MWFhYTk0ZmJhYTY0NS9saWJyYXJ5L2FsbG9jL3NyYy92ZWMvbW9kLnJzAC9ydXN0Yy8zN2FhMjEzNWI1ZDA5MzZiZDEzYWE2OTlkOTQxYWFhOTRmYmFhNjQ1L2xpYnJhcnkvYWxsb2Mvc3JjL3ZlYy9zcGVjX2Zyb21faXRlcl9uZXN0ZWQucnMAL3J1c3QvZGVwcy9kbG1hbGxvYy0wLjIuMTEvc3JjL2RsbWFsbG9jLnJzAGxpYnJhcnkvc3RkL3NyYy9hbGxvYy5ycwAvaG9tZS91YnVudHUvLmNhcmdvL3JlZ2lzdHJ5L3NyYy9pbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zi9jb25zb2xlX2Vycm9yX3BhbmljX2hvb2stMC4xLjcvc3JjL2xpYi5ycwBsaWJyYXJ5L2NvcmUvc3JjL3VuaWNvZGUvdW5pY29kZV9kYXRhLnJzABVtZW1vcnkgYWxsb2NhdGlvbiBvZiDADSBieXRlcyBmYWlsZWQAAVvAAV0AAD8GEAAKAAAApgYAABwAAAA/BhAACgAAAK4GAAA0AAAAPwYQAAoAAACuBgAAQgAAACwAAAA/BhAACgAAAJMGAAAmAAAAPwYQAAoAAACTBgAAMAAAAD8GEAAKAAAAkwYAAD4AAABLTktOVFRUVFJTUlNJSU1JUUhRSFBQUFBSUlJSTExMTEVERURBQUFBR0dHR1ZWVlYqWSpZU1NTUypDV0NMRkxGPwYQAAoAAADaAgAAGAAAAD8GEAAKAAAAwgIAABQAAAA/BhAACgAAAMICAAAnAAAAPwYQAAoAAAAGAwAAHwAAAD8GEAAKAAAADgMAABoAAAA/BhAACgAAAA4DAAASAAAAPwYQAAoAAABSAwAAEwAAAD8GEAAKAAAAUwMAABMAAAA/BhAACgAAAF8DAAAXAAAAPwYQAAoAAABgAwAAFwAAAAAAAAA/BhAACgAAAM4CAAASAAAAPwYQ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CAAAAAQAAAAVAAAAFgAAABcAAAAYAAAAGQAAABAAAAAEAAAAGgAAABsAAAAcAAAAHQAAAG1dy9YsUOtjeEGmV3Ebi7nBYDKWiPhpTMZ6vSmDB78qYXNzZXJ0aW9uIGZhaWxlZDogcHNpemUgPj0gc2l6ZSArIG1pbl9vdmVyaGVhZAAAmgUQACoAAACxBAAACQAAAGFzc2VydGlvbiBmYWlsZWQ6IHBzaXplIDw9IHNpemUgKyBtYXhfb3ZlcmhlYWQAAJoFEAAqAAAAtwQAAA0AAADFBRAAGAAAAHABAAAJAAAAY2Fubm90IG1vZGlmeSB0aGUgcGFuaWMgaG9vayBmcm9tIGEgcGFuaWNraW5nIHRocmVhZNADEAAcAAAAkAAAAAkAAAAAAAAACAAAAAQAAAAeAAAAcGFuaWNrZWQgYXQgOgoAABEAAAAMAAAABAAAAB8AAABIYXNoIHRhYmxlIGNhcGFjaXR5IG92ZXJmbG93ogQQACoAAAAlAAAAKAAAAGNhcGFjaXR5IG92ZXJmbG93AAAAzQQQACAAAAAcAAAABQAAACAAAAAMAAAABAAAACEAAAAiAAAAIwBB3KHAAAuLBAEAAAAkAAAAYSBmb3JtYXR0aW5nIHRyYWl0IGltcGxlbWVudGF0aW9uIHJldHVybmVkIGFuIGVycm9yIHdoZW4gdGhlIHVuZGVybHlpbmcgc3RyZWFtIGRpZCBub3QAAJcCEAAYAAAAigIAAA4AAABFcnJvcgAAAEoGEAAoAAAAEwMAAB0AAABoAxAAGwAAAFcCAAAFAAAAY2FsbGVkIGBPcHRpb246OnVud3JhcCgpYCBvbiBhIGBOb25lYCB2YWx1ZTAwMDEwMjAzMDQwNTA2MDcwODA5MTAxMTEyMTMxNDE1MTYxNzE4MTkyMDIxMjIyMzI0MjUyNjI3MjgyOTMwMzEzMjMzMzQzNTM2MzczODM5NDA0MTQyNDM0NDQ1NDY0NzQ4NDk1MDUxNTI1MzU0NTU1NjU3NTg1OTYwNjE2MjYzNjQ2NTY2Njc2ODY5NzA3MTcyNzM3NDc1NzY3Nzc4Nzk4MDgxODI4Mzg0ODU4Njg3ODg4OTkwOTE5MjkzOTQ5NTk2OTc5ODk5AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAQammwAALMwICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMDAwMDAwMDAwMDAwMDAwMEBAQEBABB6KbAAAuwbrUAAACcAwAA3wAAAAAAQADgAAAAwAAAAOEAAADBAAAA4gAAAMIAAADjAAAAwwAAAOQAAADEAAAA5QAAAMUAAADmAAAAxgAAAOcAAADHAAAA6AAAAMgAAADpAAAAyQAAAOoAAADKAAAA6wAAAMsAAADsAAAAzAAAAO0AAADNAAAA7gAAAM4AAADvAAAAzwAAAPAAAADQAAAA8QAAANEAAADyAAAA0gAAAPMAAADTAAAA9AAAANQAAAD1AAAA1QAAAPYAAADWAAAA+AAAANgAAAD5AAAA2QAAAPoAAADaAAAA+wAAANsAAAD8AAAA3AAAAP0AAADdAAAA/gAAAN4AAAD/AAAAeAEAAAEBAAAAAQAAAwEAAAIBAAAFAQAABAEAAAcBAAAGAQAACQEAAAgBAAALAQAACgEAAA0BAAAMAQAADwEAAA4BAAARAQAAEAEAABMBAAASAQAAFQEAABQBAAAXAQAAFgEAABkBAAAYAQAAGwEAABoBAAAdAQAAHAEAAB8BAAAeAQAAIQEAACABAAAjAQAAIgEAACUBAAAkAQAAJwEAACYBAAApAQAAKAEAACsBAAAqAQAALQEAACwBAAAvAQAALgEAADEBAABJAAAAMwEAADIBAAA1AQAANAEAADcBAAA2AQAAOgEAADkBAAA8AQAAOwEAAD4BAAA9AQAAQAEAAD8BAABCAQAAQQEAAEQBAABDAQAARgEAAEUBAABIAQAARwEAAEkBAAABAEAASwEAAEoBAABNAQAATAEAAE8BAABOAQAAUQEAAFABAABTAQAAUgEAAFUBAABUAQAAVwEAAFYBAABZAQAAWAEAAFsBAABaAQAAXQEAAFwBAABfAQAAXgEAAGEBAABgAQAAYwEAAGIBAABlAQAAZAEAAGcBAABmAQAAaQEAAGgBAABrAQAAagEAAG0BAABsAQAAbwEAAG4BAABxAQAAcAEAAHMBAAByAQAAdQEAAHQBAAB3AQAAdgEAAHoBAAB5AQAAfAEAAHsBAAB+AQAAfQEAAH8BAABTAAAAgAEAAEMCAACDAQAAggEAAIUBAACEAQAAiAEAAIcBAACMAQAAiwEAAJIBAACRAQAAlQEAAPYBAACZAQAAmAEAAJoBAAA9AgAAmwEAANynAACeAQAAIAIAAKEBAACgAQAAowEAAKIBAAClAQAApAEAAKgBAACnAQAArQEAAKwBAACwAQAArwEAALQBAACzAQAAtgEAALUBAAC5AQAAuAEAAL0BAAC8AQAAvwEAAPcBAADFAQAAxAEAAMYBAADEAQAAyAEAAMcBAADJAQAAxwEAAMsBAADKAQAAzAEAAMoBAADOAQAAzQEAANABAADPAQAA0gEAANEBAADUAQAA0wEAANYBAADVAQAA2AEAANcBAADaAQAA2QEAANwBAADbAQAA3QEAAI4BAADfAQAA3gEAAOEBAADgAQAA4wEAAOIBAADlAQAA5AEAAOcBAADmAQAA6QEAAOgBAADrAQAA6gEAAO0BAADsAQAA7wEAAO4BAADwAQAAAgBAAPIBAADxAQAA8wEAAPEBAAD1AQAA9AEAAPkBAAD4AQAA+wEAAPoBAAD9AQAA/AEAAP8BAAD+AQAAAQIAAAACAAADAgAAAgIAAAUCAAAEAgAABwIAAAYCAAAJAgAACAIAAAsCAAAKAgAADQIAAAwCAAAPAgAADgIAABECAAAQAgAAEwIAABICAAAVAgAAFAIAABcCAAAWAgAAGQIAABgCAAAbAgAAGgIAAB0CAAAcAgAAHwIAAB4CAAAjAgAAIgIAACUCAAAkAgAAJwIAACYCAAApAgAAKAIAACsCAAAqAgAALQIAACwCAAAvAgAALgIAADECAAAwAgAAMwIAADICAAA8AgAAOwIAAD8CAAB+LAAAQAIAAH8sAABCAgAAQQIAAEcCAABGAgAASQIAAEgCAABLAgAASgIAAE0CAABMAgAATwIAAE4CAABQAgAAbywAAFECAABtLAAAUgIAAHAsAABTAgAAgQEAAFQCAACGAQAAVgIAAIkBAABXAgAAigEAAFkCAACPAQAAWwIAAJABAABcAgAAq6cAAGACAACTAQAAYQIAAKynAABjAgAAlAEAAGQCAADLpwAAZQIAAI2nAABmAgAAqqcAAGgCAACXAQAAaQIAAJYBAABqAgAArqcAAGsCAABiLAAAbAIAAK2nAABvAgAAnAEAAHECAABuLAAAcgIAAJ0BAAB1AgAAnwEAAH0CAABkLAAAgAIAAKYBAACCAgAAxacAAIMCAACpAQAAhwIAALGnAACIAgAArgEAAIkCAABEAgAAigIAALEBAACLAgAAsgEAAIwCAABFAgAAkgIAALcBAACdAgAAsqcAAJ4CAACwpwAARQMAAJkDAABxAwAAcAMAAHMDAAByAwAAdwMAAHYDAAB7AwAA/QMAAHwDAAD+AwAAfQMAAP8DAACQAwAAAwBAAKwDAACGAwAArQMAAIgDAACuAwAAiQMAAK8DAACKAwAAsAMAAAQAQACxAwAAkQMAALIDAACSAwAAswMAAJMDAAC0AwAAlAMAALUDAACVAwAAtgMAAJYDAAC3AwAAlwMAALgDAACYAwAAuQMAAJkDAAC6AwAAmgMAALsDAACbAwAAvAMAAJwDAAC9AwAAnQMAAL4DAACeAwAAvwMAAJ8DAADAAwAAoAMAAMEDAAChAwAAwgMAAKMDAADDAwAAowMAAMQDAACkAwAAxQMAAKUDAADGAwAApgMAAMcDAACnAwAAyAMAAKgDAADJAwAAqQMAAMoDAACqAwAAywMAAKsDAADMAwAAjAMAAM0DAACOAwAAzgMAAI8DAADQAwAAkgMAANEDAACYAwAA1QMAAKYDAADWAwAAoAMAANcDAADPAwAA2QMAANgDAADbAwAA2gMAAN0DAADcAwAA3wMAAN4DAADhAwAA4AMAAOMDAADiAwAA5QMAAOQDAADnAwAA5gMAAOkDAADoAwAA6wMAAOoDAADtAwAA7AMAAO8DAADuAwAA8AMAAJoDAADxAwAAoQMAAPIDAAD5AwAA8wMAAH8DAAD1AwAAlQMAAPgDAAD3AwAA+wMAAPoDAAAwBAAAEAQAADEEAAARBAAAMgQAABIEAAAzBAAAEwQAADQEAAAUBAAANQQAABUEAAA2BAAAFgQAADcEAAAXBAAAOAQAABgEAAA5BAAAGQQAADoEAAAaBAAAOwQAABsEAAA8BAAAHAQAAD0EAAAdBAAAPgQAAB4EAAA/BAAAHwQAAEAEAAAgBAAAQQQAACEEAABCBAAAIgQAAEMEAAAjBAAARAQAACQEAABFBAAAJQQAAEYEAAAmBAAARwQAACcEAABIBAAAKAQAAEkEAAApBAAASgQAACoEAABLBAAAKwQAAEwEAAAsBAAATQQAAC0EAABOBAAALgQAAE8EAAAvBAAAUAQAAAAEAABRBAAAAQQAAFIEAAACBAAAUwQAAAMEAABUBAAABAQAAFUEAAAFBAAAVgQAAAYEAABXBAAABwQAAFgEAAAIBAAAWQQAAAkEAABaBAAACgQAAFsEAAALBAAAXAQAAAwEAABdBAAADQQAAF4EAAAOBAAAXwQAAA8EAABhBAAAYAQAAGMEAABiBAAAZQQAAGQEAABnBAAAZgQAAGkEAABoBAAAawQAAGoEAABtBAAAbAQAAG8EAABuBAAAcQQAAHAEAABzBAAAcgQAAHUEAAB0BAAAdwQAAHYEAAB5BAAAeAQAAHsEAAB6BAAAfQQAAHwEAAB/BAAAfgQAAIEEAACABAAAiwQAAIoEAACNBAAAjAQAAI8EAACOBAAAkQQAAJAEAACTBAAAkgQAAJUEAACUBAAAlwQAAJYEAACZBAAAmAQAAJsEAACaBAAAnQQAAJwEAACfBAAAngQAAKEEAACgBAAAowQAAKIEAAClBAAApAQAAKcEAACmBAAAqQQAAKgEAACrBAAAqgQAAK0EAACsBAAArwQAAK4EAACxBAAAsAQAALMEAACyBAAAtQQAALQEAAC3BAAAtgQAALkEAAC4BAAAuwQAALoEAAC9BAAAvAQAAL8EAAC+BAAAwgQAAMEEAADEBAAAwwQAAMYEAADFBAAAyAQAAMcEAADKBAAAyQQAAMwEAADLBAAAzgQAAM0EAADPBAAAwAQAANEEAADQBAAA0wQAANIEAADVBAAA1AQAANcEAADWBAAA2QQAANgEAADbBAAA2gQAAN0EAADcBAAA3wQAAN4EAADhBAAA4AQAAOMEAADiBAAA5QQAAOQEAADnBAAA5gQAAOkEAADoBAAA6wQAAOoEAADtBAAA7AQAAO8EAADuBAAA8QQAAPAEAADzBAAA8gQAAPUEAAD0BAAA9wQAAPYEAAD5BAAA+AQAAPsEAAD6BAAA/QQAAPwEAAD/BAAA/gQAAAEFAAAABQAAAwUAAAIFAAAFBQAABAUAAAcFAAAGBQAACQUAAAgFAAALBQAACgUAAA0FAAAMBQAADwUAAA4FAAARBQAAEAUAABMFAAASBQAAFQUAABQFAAAXBQAAFgUAABkFAAAYBQAAGwUAABoFAAAdBQAAHAUAAB8FAAAeBQAAIQUAACAFAAAjBQAAIgUAACUFAAAkBQAAJwUAACYFAAApBQAAKAUAACsFAAAqBQAALQUAACwFAAAvBQAALgUAAGEFAAAxBQAAYgUAADIFAABjBQAAMwUAAGQFAAA0BQAAZQUAADUFAABmBQAANgUAAGcFAAA3BQAAaAUAADgFAABpBQAAOQUAAGoFAAA6BQAAawUAADsFAABsBQAAPAUAAG0FAAA9BQAAbgUAAD4FAABvBQAAPwUAAHAFAABABQAAcQUAAEEFAAByBQAAQgUAAHMFAABDBQAAdAUAAEQFAAB1BQAARQUAAHYFAABGBQAAdwUAAEcFAAB4BQAASAUAAHkFAABJBQAAegUAAEoFAAB7BQAASwUAAHwFAABMBQAAfQUAAE0FAAB+BQAATgUAAH8FAABPBQAAgAUAAFAFAACBBQAAUQUAAIIFAABSBQAAgwUAAFMFAACEBQAAVAUAAIUFAABVBQAAhgUAAFYFAACHBQAABQBAANAQAACQHAAA0RAAAJEcAADSEAAAkhwAANMQAACTHAAA1BAAAJQcAADVEAAAlRwAANYQAACWHAAA1xAAAJccAADYEAAAmBwAANkQAACZHAAA2hAAAJocAADbEAAAmxwAANwQAACcHAAA3RAAAJ0cAADeEAAAnhwAAN8QAACfHAAA4BAAAKAcAADhEAAAoRwAAOIQAACiHAAA4xAAAKMcAADkEAAApBwAAOUQAAClHAAA5hAAAKYcAADnEAAApxwAAOgQAACoHAAA6RAAAKkcAADqEAAAqhwAAOsQAACrHAAA7BAAAKwcAADtEAAArRwAAO4QAACuHAAA7xAAAK8cAADwEAAAsBwAAPEQAACxHAAA8hAAALIcAADzEAAAsxwAAPQQAAC0HAAA9RAAALUcAAD2EAAAthwAAPcQAAC3HAAA+BAAALgcAAD5EAAAuRwAAPoQAAC6HAAA/RAAAL0cAAD+EAAAvhwAAP8QAAC/HAAA+BMAAPATAAD5EwAA8RMAAPoTAADyEwAA+xMAAPMTAAD8EwAA9BMAAP0TAAD1EwAAgBwAABIEAACBHAAAFAQAAIIcAAAeBAAAgxwAACEEAACEHAAAIgQAAIUcAAAiBAAAhhwAACoEAACHHAAAYgQAAIgcAABKpgAAihwAAIkcAAB5HQAAfacAAH0dAABjLAAAjh0AAManAAABHgAAAB4AAAMeAAACHgAABR4AAAQeAAAHHgAABh4AAAkeAAAIHgAACx4AAAoeAAANHgAADB4AAA8eAAAOHgAAER4AABAeAAATHgAAEh4AABUeAAAUHgAAFx4AABYeAAAZHgAAGB4AABseAAAaHgAAHR4AABweAAAfHgAAHh4AACEeAAAgHgAAIx4AACIeAAAlHgAAJB4AACceAAAmHgAAKR4AACgeAAArHgAAKh4AAC0eAAAsHgAALx4AAC4eAAAxHgAAMB4AADMeAAAyHgAANR4AADQeAAA3HgAANh4AADkeAAA4HgAAOx4AADoeAAA9HgAAPB4AAD8eAAA+HgAAQR4AAEAeAABDHgAAQh4AAEUeAABEHgAARx4AAEYeAABJHgAASB4AAEseAABKHgAATR4AAEweAABPHgAATh4AAFEeAABQHgAAUx4AAFIeAABVHgAAVB4AAFceAABWHgAAWR4AAFgeAABbHgAAWh4AAF0eAABcHgAAXx4AAF4eAABhHgAAYB4AAGMeAABiHgAAZR4AAGQeAABnHgAAZh4AAGkeAABoHgAAax4AAGoeAABtHgAAbB4AAG8eAABuHgAAcR4AAHAeAABzHgAAch4AAHUeAAB0HgAAdx4AAHYeAAB5HgAAeB4AAHseAAB6HgAAfR4AAHweAAB/HgAAfh4AAIEeAACAHgAAgx4AAIIeAACFHgAAhB4AAIceAACGHgAAiR4AAIgeAACLHgAAih4AAI0eAACMHgAAjx4AAI4eAACRHgAAkB4AAJMeAACSHgAAlR4AAJQeAACWHgAABgBAAJceAAAHAEAAmB4AAAgAQACZHgAACQBAAJoeAAAKAEAAmx4AAGAeAAChHgAAoB4AAKMeAACiHgAApR4AAKQeAACnHgAAph4AAKkeAACoHgAAqx4AAKoeAACtHgAArB4AAK8eAACuHgAAsR4AALAeAACzHgAAsh4AALUeAAC0HgAAtx4AALYeAAC5HgAAuB4AALseAAC6HgAAvR4AALweAAC/HgAAvh4AAMEeAADAHgAAwx4AAMIeAADFHgAAxB4AAMceAADGHgAAyR4AAMgeAADLHgAAyh4AAM0eAADMHgAAzx4AAM4eAADRHgAA0B4AANMeAADSHgAA1R4AANQeAADXHgAA1h4AANkeAADYHgAA2x4AANoeAADdHgAA3B4AAN8eAADeHgAA4R4AAOAeAADjHgAA4h4AAOUeAADkHgAA5x4AAOYeAADpHgAA6B4AAOseAADqHgAA7R4AAOweAADvHgAA7h4AAPEeAADwHgAA8x4AAPIeAAD1HgAA9B4AAPceAAD2HgAA+R4AAPgeAAD7HgAA+h4AAP0eAAD8HgAA/x4AAP4eAAAAHwAACB8AAAEfAAAJHwAAAh8AAAofAAADHwAACx8AAAQfAAAMHwAABR8AAA0fAAAGHwAADh8AAAcfAAAPHwAAEB8AABgfAAARHwAAGR8AABIfAAAaHwAAEx8AABsfAAAUHwAAHB8AABUfAAAdHwAAIB8AACgfAAAhHwAAKR8AACIfAAAqHwAAIx8AACsfAAAkHwAALB8AACUfAAAtHwAAJh8AAC4fAAAnHwAALx8AADAfAAA4HwAAMR8AADkfAAAyHwAAOh8AADMfAAA7HwAANB8AADwfAAA1HwAAPR8AADYfAAA+HwAANx8AAD8fAABAHwAASB8AAEEfAABJHwAAQh8AAEofAABDHwAASx8AAEQfAABMHwAARR8AAE0fAABQHwAACwBAAFEfAABZHwAAUh8AAAwAQABTHwAAWx8AAFQfAAANAEAAVR8AAF0fAABWHwAADgBAAFcfAABfHwAAYB8AAGgfAABhHwAAaR8AAGIfAABqHwAAYx8AAGsfAABkHwAAbB8AAGUfAABtHwAAZh8AAG4fAABnHwAAbx8AAHAfAAC6HwAAcR8AALsfAAByHwAAyB8AAHMfAADJHwAAdB8AAMofAAB1HwAAyx8AAHYfAADaHwAAdx8AANsfAAB4HwAA+B8AAHkfAAD5HwAAeh8AAOofAAB7HwAA6x8AAHwfAAD6HwAAfR8AAPsfAACAHwAADwBAAIEfAAAQAEAAgh8AABEAQACDHwAAEgBAAIQfAAATAEAAhR8AABQAQACGHwAAFQBAAIcfAAAWAEAAiB8AABcAQACJHwAAGABAAIofAAAZAEAAix8AABoAQACMHwAAGwBAAI0fAAAcAEAAjh8AAB0AQACPHwAAHgBAAJAfAAAfAEAAkR8AACAAQACSHwAAIQBAAJMfAAAiAEAAlB8AACMAQACVHwAAJABAAJYfAAAlAEAAlx8AACYAQACYHwAAJwBAAJkfAAAoAEAAmh8AACkAQACbHwAAKgBAAJwfAAArAEAAnR8AACwAQACeHwAALQBAAJ8fAAAuAEAAoB8AAC8AQAChHwAAMABAAKIfAAAxAEAAox8AADIAQACkHwAAMwBAAKUfAAA0AEAAph8AADUAQACnHwAANgBAAKgfAAA3AEAAqR8AADgAQACqHwAAOQBAAKsfAAA6AEAArB8AADsAQACtHwAAPABAAK4fAAA9AEAArx8AAD4AQACwHwAAuB8AALEfAAC5HwAAsh8AAD8AQACzHwAAQABAALQfAABBAEAAth8AAEIAQAC3HwAAQwBAALwfAABEAEAAvh8AAJkDAADCHwAARQBAAMMfAABGAEAAxB8AAEcAQADGHwAASABAAMcfAABJAEAAzB8AAEoAQADQHwAA2B8AANEfAADZHwAA0h8AAEsAQADTHwAATABAANYfAABNAEAA1x8AAE4AQADgHwAA6B8AAOEfAADpHwAA4h8AAE8AQADjHwAAUABAAOQfAABRAEAA5R8AAOwfAADmHwAAUgBAAOcfAABTAEAA8h8AAFQAQADzHwAAVQBAAPQfAABWAEAA9h8AAFcAQAD3HwAAWABAAPwfAABZAEAATiEAADIhAABwIQAAYCEAAHEhAABhIQAAciEAAGIhAABzIQAAYyEAAHQhAABkIQAAdSEAAGUhAAB2IQAAZiEAAHchAABnIQAAeCEAAGghAAB5IQAAaSEAAHohAABqIQAAeyEAAGshAAB8IQAAbCEAAH0hAABtIQAAfiEAAG4hAAB/IQAAbyEAAIQhAACDIQAA0CQAALYkAADRJAAAtyQAANIkAAC4JAAA0yQAALkkAADUJAAAuiQAANUkAAC7JAAA1iQAALwkAADXJAAAvSQAANgkAAC+JAAA2SQAAL8kAADaJAAAwCQAANskAADBJAAA3CQAAMIkAADdJAAAwyQAAN4kAADEJAAA3yQAAMUkAADgJAAAxiQAAOEkAADHJAAA4iQAAMgkAADjJAAAySQAAOQkAADKJAAA5SQAAMskAADmJAAAzCQAAOckAADNJAAA6CQAAM4kAADpJAAAzyQAADAsAAAALAAAMSwAAAEsAAAyLAAAAiwAADMsAAADLAAANCwAAAQsAAA1LAAABSwAADYsAAAGLAAANywAAAcsAAA4LAAACCwAADksAAAJLAAAOiwAAAosAAA7LAAACywAADwsAAAMLAAAPSwAAA0sAAA+LAAADiwAAD8sAAAPLAAAQCwAABAsAABBLAAAESwAAEIsAAASLAAAQywAABMsAABELAAAFCwAAEUsAAAVLAAARiwAABYsAABHLAAAFywAAEgsAAAYLAAASSwAABksAABKLAAAGiwAAEssAAAbLAAATCwAABwsAABNLAAAHSwAAE4sAAAeLAAATywAAB8sAABQLAAAICwAAFEsAAAhLAAAUiwAACIsAABTLAAAIywAAFQsAAAkLAAAVSwAACUsAABWLAAAJiwAAFcsAAAnLAAAWCwAACgsAABZLAAAKSwAAFosAAAqLAAAWywAACssAABcLAAALCwAAF0sAAAtLAAAXiwAAC4sAABfLAAALywAAGEsAABgLAAAZSwAADoCAABmLAAAPgIAAGgsAABnLAAAaiwAAGksAABsLAAAaywAAHMsAAByLAAAdiwAAHUsAACBLAAAgCwAAIMsAACCLAAAhSwAAIQsAACHLAAAhiwAAIksAACILAAAiywAAIosAACNLAAAjCwAAI8sAACOLAAAkSwAAJAsAACTLAAAkiwAAJUsAACULAAAlywAAJYsAACZLAAAmCwAAJssAACaLAAAnSwAAJwsAACfLAAAniwAAKEsAACgLAAAoywAAKIsAAClLAAApCwAAKcsAACmLAAAqSwAAKgsAACrLAAAqiwAAK0sAACsLAAArywAAK4sAACxLAAAsCwAALMsAACyLAAAtSwAALQsAAC3LAAAtiwAALksAAC4LAAAuywAALosAAC9LAAAvCwAAL8sAAC+LAAAwSwAAMAsAADDLAAAwiwAAMUsAADELAAAxywAAMYsAADJLAAAyCwAAMssAADKLAAAzSwAAMwsAADPLAAAziwAANEsAADQLAAA0ywAANIsAADVLAAA1CwAANcsAADWLAAA2SwAANgsAADbLAAA2iwAAN0sAADcLAAA3ywAAN4sAADhLAAA4CwAAOMsAADiLAAA7CwAAOssAADuLAAA7SwAAPMsAADyLAAAAC0AAKAQAAABLQAAoRAAAAItAACiEAAAAy0AAKMQAAAELQAApBAAAAUtAAClEAAABi0AAKYQAAAHLQAApxAAAAgtAACoEAAACS0AAKkQAAAKLQAAqhAAAAstAACrEAAADC0AAKwQAAANLQAArRAAAA4tAACuEAAADy0AAK8QAAAQLQAAsBAAABEtAACxEAAAEi0AALIQAAATLQAAsxAAABQtAAC0EAAAFS0AALUQAAAWLQAAthAAABctAAC3EAAAGC0AALgQAAAZLQAAuRAAABotAAC6EAAAGy0AALsQAAAcLQAAvBAAAB0tAAC9EAAAHi0AAL4QAAAfLQAAvxAAACAtAADAEAAAIS0AAMEQAAAiLQAAwhAAACMtAADDEAAAJC0AAMQQAAAlLQAAxRAAACctAADHEAAALS0AAM0QAABBpgAAQKYAAEOmAABCpgAARaYAAESmAABHpgAARqYAAEmmAABIpgAAS6YAAEqmAABNpgAATKYAAE+mAABOpgAAUaYAAFCmAABTpgAAUqYAAFWmAABUpgAAV6YAAFamAABZpgAAWKYAAFumAABapgAAXaYAAFymAABfpgAAXqYAAGGmAABgpgAAY6YAAGKmAABlpgAAZKYAAGemAABmpgAAaaYAAGimAABrpgAAaqYAAG2mAABspgAAgaYAAICmAACDpgAAgqYAAIWmAACEpgAAh6YAAIamAACJpgAAiKYAAIumAACKpgAAjaYAAIymAACPpgAAjqYAAJGmAACQpgAAk6YAAJKmAACVpgAAlKYAAJemAACWpgAAmaYAAJimAACbpgAAmqYAACOnAAAipwAAJacAACSnAAAnpwAAJqcAACmnAAAopwAAK6cAACqnAAAtpwAALKcAAC+nAAAupwAAM6cAADKnAAA1pwAANKcAADenAAA2pwAAOacAADinAAA7pwAAOqcAAD2nAAA8pwAAP6cAAD6nAABBpwAAQKcAAEOnAABCpwAARacAAESnAABHpwAARqcAAEmnAABIpwAAS6cAAEqnAABNpwAATKcAAE+nAABOpwAAUacAAFCnAABTpwAAUqcAAFWnAABUpwAAV6cAAFanAABZpwAAWKcAAFunAABapwAAXacAAFynAABfpwAAXqcAAGGnAABgpwAAY6cAAGKnAABlpwAAZKcAAGenAABmpwAAaacAAGinAABrpwAAaqcAAG2nAABspwAAb6cAAG6nAAB6pwAAeacAAHynAAB7pwAAf6cAAH6nAACBpwAAgKcAAIOnAACCpwAAhacAAISnAACHpwAAhqcAAIynAACLpwAAkacAAJCnAACTpwAAkqcAAJSnAADEpwAAl6cAAJanAACZpwAAmKcAAJunAACapwAAnacAAJynAACfpwAAnqcAAKGnAACgpwAAo6cAAKKnAAClpwAApKcAAKenAACmpwAAqacAAKinAAC1pwAAtKcAALenAAC2pwAAuacAALinAAC7pwAAuqcAAL2nAAC8pwAAv6cAAL6nAADBpwAAwKcAAMOnAADCpwAAyKcAAMenAADKpwAAyacAAM2nAADMpwAAz6cAAM6nAADRpwAA0KcAANOnAADSpwAA1acAANSnAADXpwAA1qcAANmnAADYpwAA26cAANqnAAD2pwAA9acAAFOrAACzpwAAcKsAAKATAABxqwAAoRMAAHKrAACiEwAAc6sAAKMTAAB0qwAApBMAAHWrAAClEwAAdqsAAKYTAAB3qwAApxMAAHirAACoEwAAeasAAKkTAAB6qwAAqhMAAHurAACrEwAAfKsAAKwTAAB9qwAArRMAAH6rAACuEwAAf6sAAK8TAACAqwAAsBMAAIGrAACxEwAAgqsAALITAACDqwAAsxMAAISrAAC0EwAAhasAALUTAACGqwAAthMAAIerAAC3EwAAiKsAALgTAACJqwAAuRMAAIqrAAC6EwAAi6sAALsTAACMqwAAvBMAAI2rAAC9EwAAjqsAAL4TAACPqwAAvxMAAJCrAADAEwAAkasAAMETAACSqwAAwhMAAJOrAADDEwAAlKsAAMQTAACVqwAAxRMAAJarAADGEwAAl6sAAMcTAACYqwAAyBMAAJmrAADJEwAAmqsAAMoTAACbqwAAyxMAAJyrAADMEwAAnasAAM0TAACeqwAAzhMAAJ+rAADPEwAAoKsAANATAAChqwAA0RMAAKKrAADSEwAAo6sAANMTAACkqwAA1BMAAKWrAADVEwAApqsAANYTAACnqwAA1xMAAKirAADYEwAAqasAANkTAACqqwAA2hMAAKurAADbEwAArKsAANwTAACtqwAA3RMAAK6rAADeEwAAr6sAAN8TAACwqwAA4BMAALGrAADhEwAAsqsAAOITAACzqwAA4xMAALSrAADkEwAAtasAAOUTAAC2qwAA5hMAALerAADnEwAAuKsAAOgTAAC5qwAA6RMAALqrAADqEwAAu6sAAOsTAAC8qwAA7BMAAL2rAADtEwAAvqsAAO4TAAC/qwAA7xMAAAD7AABaAEAAAfsAAFsAQAAC+wAAXABAAAP7AABdAEAABPsAAF4AQAAF+wAAXwBAAAb7AABgAEAAE/sAAGEAQAAU+wAAYgBAABX7AABjAEAAFvsAAGQAQAAX+wAAZQBAAEH/AAAh/wAAQv8AACL/AABD/wAAI/8AAET/AAAk/wAARf8AACX/AABG/wAAJv8AAEf/AAAn/wAASP8AACj/AABJ/wAAKf8AAEr/AAAq/wAAS/8AACv/AABM/wAALP8AAE3/AAAt/wAATv8AAC7/AABP/wAAL/8AAFD/AAAw/wAAUf8AADH/AABS/wAAMv8AAFP/AAAz/wAAVP8AADT/AABV/wAANf8AAFb/AAA2/wAAV/8AADf/AABY/wAAOP8AAFn/AAA5/wAAWv8AADr/AAAoBAEAAAQBACkEAQABBAEAKgQBAAIEAQArBAEAAwQBACwEAQAEBAEALQQBAAUEAQAuBAEABgQBAC8EAQAHBAEAMAQBAAgEAQAxBAEACQQBADIEAQAKBAEAMwQBAAsEAQA0BAEADAQBADUEAQANBAEANgQBAA4EAQA3BAEADwQBADgEAQAQBAEAOQQBABEEAQA6BAEAEgQBADsEAQATBAEAPAQBABQEAQA9BAEAFQQBAD4EAQAWBAEAPwQBABcEAQBABAEAGAQBAEEEAQAZBAEAQgQBABoEAQBDBAEAGwQBAEQEAQAcBAEARQQBAB0EAQBGBAEAHgQBAEcEAQAfBAEASAQBACAEAQBJBAEAIQQBAEoEAQAiBAEASwQBACMEAQBMBAEAJAQBAE0EAQAlBAEATgQBACYEAQBPBAEAJwQBANgEAQCwBAEA2QQBALEEAQDaBAEAsgQBANsEAQCzBAEA3AQBALQEAQDdBAEAtQQBAN4EAQC2BAEA3wQBALcEAQDgBAEAuAQBAOEEAQC5BAEA4gQBALoEAQDjBAEAuwQBAOQEAQC8BAEA5QQBAL0EAQDmBAEAvgQBAOcEAQC/BAEA6AQBAMAEAQDpBAEAwQQBAOoEAQDCBAEA6wQBAMMEAQDsBAEAxAQBAO0EAQDFBAEA7gQBAMYEAQDvBAEAxwQBAPAEAQDIBAEA8QQBAMkEAQDyBAEAygQBAPMEAQDLBAEA9AQBAMwEAQD1BAEAzQQBAPYEAQDOBAEA9wQBAM8EAQD4BAEA0AQBAPkEAQDRBAEA+gQBANIEAQD7BAEA0wQBAJcFAQBwBQEAmAUBAHEFAQCZBQEAcgUBAJoFAQBzBQEAmwUBAHQFAQCcBQEAdQUBAJ0FAQB2BQEAngUBAHcFAQCfBQEAeAUBAKAFAQB5BQEAoQUBAHoFAQCjBQEAfAUBAKQFAQB9BQEApQUBAH4FAQCmBQEAfwUBAKcFAQCABQEAqAUBAIEFAQCpBQEAggUBAKoFAQCDBQEAqwUBAIQFAQCsBQEAhQUBAK0FAQCGBQEArgUBAIcFAQCvBQEAiAUBALAFAQCJBQEAsQUBAIoFAQCzBQEAjAUBALQFAQCNBQEAtQUBAI4FAQC2BQEAjwUBALcFAQCQBQEAuAUBAJEFAQC5BQEAkgUBALsFAQCUBQEAvAUBAJUFAQDADAEAgAwBAMEMAQCBDAEAwgwBAIIMAQDDDAEAgwwBAMQMAQCEDAEAxQwBAIUMAQDGDAEAhgwBAMcMAQCHDAEAyAwBAIgMAQDJDAEAiQwBAMoMAQCKDAEAywwBAIsMAQDMDAEAjAwBAM0MAQCNDAEAzgwBAI4MAQDPDAEAjwwBANAMAQCQDAEA0QwBAJEMAQDSDAEAkgwBANMMAQCTDAEA1AwBAJQMAQDVDAEAlQwBANYMAQCWDAEA1wwBAJcMAQDYDAEAmAwBANkMAQCZDAEA2gwBAJoMAQDbDAEAmwwBANwMAQCcDAEA3QwBAJ0MAQDeDAEAngwBAN8MAQCfDAEA4AwBAKAMAQDhDAEAoQwBAOIMAQCiDAEA4wwBAKMMAQDkDAEApAwBAOUMAQClDAEA5gwBAKYMAQDnDAEApwwBAOgMAQCoDAEA6QwBAKkMAQDqDAEAqgwBAOsMAQCrDAEA7AwBAKwMAQDtDAEArQwBAO4MAQCuDAEA7wwBAK8MAQDwDAEAsAwBAPEMAQCxDAEA8gwBALIMAQBwDQEAUA0BAHENAQBRDQEAcg0BAFINAQBzDQEAUw0BAHQNAQBUDQEAdQ0BAFUNAQB2DQEAVg0BAHcNAQBXDQEAeA0BAFgNAQB5DQEAWQ0BAHoNAQBaDQEAew0BAFsNAQB8DQEAXA0BAH0NAQBdDQEAfg0BAF4NAQB/DQEAXw0BAIANAQBgDQEAgQ0BAGENAQCCDQEAYg0BAIMNAQBjDQEAhA0BAGQNAQCFDQEAZQ0BAMAYAQCgGAEAwRgBAKEYAQDCGAEAohgBAMMYAQCjGAEAxBgBAKQYAQDFGAEApRgBAMYYAQCmGAEAxxgBAKcYAQDIGAEAqBgBAMkYAQCpGAEAyhgBAKoYAQDLGAEAqxgBAMwYAQCsGAEAzRgBAK0YAQDOGAEArhgBAM8YAQCvGAEA0BgBALAYAQDRGAEAsRgBANIYAQCyGAEA0xgBALMYAQDUGAEAtBgBANUYAQC1GAEA1hgBALYYAQDXGAEAtxgBANgYAQC4GAEA2RgBALkYAQDaGAEAuhgBANsYAQC7GAEA3BgBALwYAQDdGAEAvRgBAN4YAQC+GAEA3xgBAL8YAQBgbgEAQG4BAGFuAQBBbgEAYm4BAEJuAQBjbgEAQ24BAGRuAQBEbgEAZW4BAEVuAQBmbgEARm4BAGduAQBHbgEAaG4BAEhuAQBpbgEASW4BAGpuAQBKbgEAa24BAEtuAQBsbgEATG4BAG1uAQBNbgEAbm4BAE5uAQBvbgEAT24BAHBuAQBQbgEAcW4BAFFuAQBybgEAUm4BAHNuAQBTbgEAdG4BAFRuAQB1bgEAVW4BAHZuAQBWbgEAd24BAFduAQB4bgEAWG4BAHluAQBZbgEAem4BAFpuAQB7bgEAW24BAHxuAQBcbgEAfW4BAF1uAQB+bgEAXm4BAH9uAQBfbgEAu24BAKBuAQC8bgEAoW4BAL1uAQCibgEAvm4BAKNuAQC/bgEApG4BAMBuAQClbgEAwW4BAKZuAQDCbgEAp24BAMNuAQCobgEAxG4BAKluAQDFbgEAqm4BAMZuAQCrbgEAx24BAKxuAQDIbgEArW4BAMluAQCubgEAym4BAK9uAQDLbgEAsG4BAMxuAQCxbgEAzW4BALJuAQDObgEAs24BAM9uAQC0bgEA0G4BALVuAQDRbgEAtm4BANJuAQC3bgEA024BALhuAQAi6QEAAOkBACPpAQAB6QEAJOkBAALpAQAl6QEAA+kBACbpAQAE6QEAJ+kBAAXpAQAo6QEABukBACnpAQAH6QEAKukBAAjpAQAr6QEACekBACzpAQAK6QEALekBAAvpAQAu6QEADOkBAC/pAQAN6QEAMOkBAA7pAQAx6QEAD+kBADLpAQAQ6QEAM+kBABHpAQA06QEAEukBADXpAQAT6QEANukBABTpAQA36QEAFekBADjpAQAW6QEAOekBABfpAQA66QEAGOkBADvpAQAZ6QEAPOkBABrpAQA96QEAG+kBAD7pAQAc6QEAP+kBAB3pAQBA6QEAHukBAEHpAQAf6QEAQukBACDpAQBD6QEAIekBAFMAAABTAAAAAAAAALwCAABOAAAAAAAAAEoAAAAMAwAAAAAAAJkDAAAIAwAAAQMAAKUDAAAIAwAAAQMAADUFAABSBQAAAAAAAEgAAAAxAwAAAAAAAFQAAAAIAwAAAAAAAFcAAAAKAwAAAAAAAFkAAAAKAwAAAAAAAEEAAAC+AgAAAAAAAKUDAAATAwAAAAAAAKUDAAATAwAAAAMAAKUDAAATAwAAAQMAAKUDAAATAwAAQgMAAAgfAACZAwAAAAAAAAkfAACZAwAAAAAAAAofAACZAwAAAAAAAAsfAACZAwAAAAAAAAwfAACZAwAAAAAAAA0fAACZAwAAAAAAAA4fAACZAwAAAAAAAA8fAACZAwAAAAAAAAgfAACZAwAAAAAAAAkfAACZAwAAAAAAAAofAACZAwAAAAAAAAsfAACZAwAAAAAAAAwfAACZAwAAAAAAAA0fAACZAwAAAAAAAA4fAACZAwAAAAAAAA8fAACZAwAAAAAAACgfAACZAwAAAAAAACkfAACZAwAAAAAAACofAACZAwAAAAAAACsfAACZAwAAAAAAACwfAACZAwAAAAAAAC0fAACZAwAAAAAAAC4fAACZAwAAAAAAAC8fAACZAwAAAAAAACgfAACZAwAAAAAAACkfAACZAwAAAAAAACofAACZAwAAAAAAACsfAACZAwAAAAAAACwfAACZAwAAAAAAAC0fAACZAwAAAAAAAC4fAACZAwAAAAAAAC8fAACZAwAAAAAAAGgfAACZAwAAAAAAAGkfAACZAwAAAAAAAGofAACZAwAAAAAAAGsfAACZAwAAAAAAAGwfAACZAwAAAAAAAG0fAACZAwAAAAAAAG4fAACZAwAAAAAAAG8fAACZAwAAAAAAAGgfAACZAwAAAAAAAGkfAACZAwAAAAAAAGofAACZAwAAAAAAAGsfAACZAwAAAAAAAGwfAACZAwAAAAAAAG0fAACZAwAAAAAAAG4fAACZAwAAAAAAAG8fAACZAwAAAAAAALofAACZAwAAAAAAAJEDAACZAwAAAAAAAIYDAACZAwAAAAAAAJEDAABCAwAAAAAAAJEDAABCAwAAmQMAAJEDAACZAwAAAAAAAMofAACZAwAAAAAAAJcDAACZAwAAAAAAAIkDAACZAwAAAAAAAJcDAABCAwAAAAAAAJcDAABCAwAAmQMAAJcDAACZAwAAAAAAAJkDAAAIAwAAAAMAAJkDAAAIAwAAAQMAAJkDAABCAwAAAAAAAJkDAAAIAwAAQgMAAKUDAAAIAwAAAAMAAKUDAAAIAwAAAQMAAKEDAAATAwAAAAAAAKUDAABCAwAAAAAAAKUDAAAIAwAAQgMAAPofAACZAwAAAAAAAKkDAACZAwAAAAAAAI8DAACZAwAAAAAAAKkDAABCAwAAAAAAAKkDAABCAwAAmQMAAKkDAACZAwAAAAAAAEYAAABGAAAAAAAAAEYAAABJAAAAAAAAAEYAAABMAAAAAAAAAEYAAABGAAAASQAAAEYAAABGAAAATAAAAFMAAABUAAAAAAAAAFMAAABUAAAAAAAAAEQFAABGBQAAAAAAAEQFAAA1BQAAAAAAAEQFAAA7BQAAAAAAAE4FAABGBQAAAAAAAEQFAAA9BQAAAAAAAHVzZXItcHJvdmlkZWQgY29tcGFyaXNvbiBmdW5jdGlvbiBkb2VzIG5vdCBjb3JyZWN0bHkgaW1wbGVtZW50IGEgdG90YWwgb3JkZXIHAhAALwAAAFwDAAAFAAAAZmFsc2V0cnVlUmVmQ2VsbCBhbHJlYWR5IGJvcnJvd2VkAAAAAwAAAAQAAAAEAAAABgAAAIP5ogBETm4A/CkVANFXJwDdNPUAYtvAADyZlQBBkEMAY1H+ALveqwC3YcUAOm4kANJNQgBJBuAACeouAByS0QDrHf4AKbEcAOg+pwD1NYIARLsuAJzphAC0JnAAQX5fANaROQBTgzkAnPQ5AItfhAAo+b0A+B87AN7/lwAPmAUAES/vAApaiwBtH20Az342AAnLJwBGT7cAnmY/AC3qXwC6J3UA5evHAD178QD3OQcAklKKAPtr6gAfsV8ACF2NADADVgB7/EYA8KtrACC8zwA29JoA46kdAF5hkQAIG+YAhZllAKAUXwCNQGgAgNj/ACdzTQAGBjEAylYVAMmocwB74mAAa4zAAAAAAED7Ifk/AAAAAC1EdD4AAACAmEb4PAAAAGBRzHg7AAAAgIMb8DkAAABAICV6OAAAAIAiguM2AAAAAB3zaTUAQaCVwQALAQQAhAEJcHJvZHVjZXJzAghsYW5ndWFnZQEEUnVzdAAMcHJvY2Vzc2VkLWJ5AwVydXN0YyUxLjk0LjAtbmlnaHRseSAoMzdhYTIxMzViIDIwMjUtMTItMDgpBndhbHJ1cwYwLjI0LjQMd2FzbS1iaW5kZ2VuEzAuMi4xMDYgKDExODMxZmI4OSkAaw90YXJnZXRfZmVhdHVyZXMGKw9tdXRhYmxlLWdsb2JhbHMrE25vbnRyYXBwaW5nLWZwdG9pbnQrC2J1bGstbWVtb3J5KwhzaWduLWV4dCsPcmVmZXJlbmNlLXR5cGVzKwptdWx0aXZhbHVl";
const wasmBytes = Uint8Array.from(Buffer.from(wasmBase64, "base64"));

const wasmModule = new WebAssembly.Module(wasmBytes);
const wasm = exports.__wasm = new WebAssembly.Instance(wasmModule, imports).exports;

wasm.__wbindgen_start();
