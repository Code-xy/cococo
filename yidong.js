// ============ CryptoJS 核心库（内嵌） ============
const CryptoJS = (function() {
    const C = {};
    const C_lib = C.lib = {};
    const Base = C_lib.Base = (function() {
        return {
            extend: function(overrides) {
                const subtype = Object.create(this);
                if (overrides) {
                    Object.assign(subtype, overrides);
                }
                return subtype;
            },
            create: function() {
                const instance = Object.create(this);
                instance.init && instance.init.apply(instance, arguments);
                return instance;
            }
        };
    })();
    
    const WordArray = C_lib.WordArray = Base.extend({
        init: function(words, sigBytes) {
            words = this.words = words || [];
            this.sigBytes = sigBytes != undefined ? sigBytes : words.length * 4;
        },
        concat: function(wordArray) {
            const thisWords = this.words;
            const thatWords = wordArray.words;
            const thisSigBytes = this.sigBytes;
            const thatSigBytes = wordArray.sigBytes;
            
            this.clamp();
            
            if (thisSigBytes % 4) {
                for (let i = 0; i < thatSigBytes; i++) {
                    const thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
                }
            } else {
                for (let i = 0; i < thatSigBytes; i += 4) {
                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
                }
            }
            this.sigBytes += thatSigBytes;
            
            return this;
        },
        clamp: function() {
            const words = this.words;
            const sigBytes = this.sigBytes;
            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
            words.length = Math.ceil(sigBytes / 4);
        },
        clone: function() {
            const clone = Base.clone.call(this);
            clone.words = this.words.slice(0);
            return clone;
        }
    });
    
    const C_enc = C.enc = {};
    
    const Hex = C_enc.Hex = {
        stringify: function(wordArray) {
            const words = wordArray.words;
            const sigBytes = wordArray.sigBytes;
            const hexChars = [];
            for (let i = 0; i < sigBytes; i++) {
                const bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                hexChars.push((bite >>> 4).toString(16));
                hexChars.push((bite & 0x0f).toString(16));
            }
            return hexChars.join('');
        },
        parse: function(hexStr) {
            const hexStrLength = hexStr.length;
            const words = [];
            for (let i = 0; i < hexStrLength; i += 2) {
                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
            }
            return WordArray.create(words, hexStrLength / 2);
        }
    };
    
    const Latin1 = C_enc.Latin1 = {
        stringify: function(wordArray) {
            const words = wordArray.words;
            const sigBytes = wordArray.sigBytes;
            const latin1Chars = [];
            for (let i = 0; i < sigBytes; i++) {
                const bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                latin1Chars.push(String.fromCharCode(bite));
            }
            return latin1Chars.join('');
        },
        parse: function(latin1Str) {
            const latin1StrLength = latin1Str.length;
            const words = [];
            for (let i = 0; i < latin1StrLength; i++) {
                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
            }
            return WordArray.create(words, latin1StrLength);
        }
    };
    
    const Utf8 = C_enc.Utf8 = {
        stringify: function(wordArray) {
            try {
                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
            } catch (e) {
                throw new Error('Malformed UTF-8 data');
            }
        },
        parse: function(utf8Str) {
            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
        }
    };
    
    const Base64 = C_enc.Base64 = {
        stringify: function(wordArray) {
            const words = wordArray.words;
            const sigBytes = wordArray.sigBytes;
            const map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            const base64Chars = [];
            for (let i = 0; i < sigBytes; i += 3) {
                const byte1 = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                const byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
                const byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;
                const triplet = (byte1 << 16) | (byte2 << 8) | byte3;
                for (let j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
                }
            }
            const paddingChar = map.charAt(64);
            if (paddingChar) {
                while (base64Chars.length % 4) {
                    base64Chars.push(paddingChar);
                }
            }
            return base64Chars.join('');
        },
        parse: function(base64Str) {
            let base64StrLength = base64Str.length;
            const map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            let paddingChar = map.charAt(64);
            if (paddingChar) {
                const paddingIndex = base64Str.indexOf(paddingChar);
                if (paddingIndex !== -1) {
                    base64StrLength = paddingIndex;
                }
            }
            const words = [];
            let nBytes = 0;
            for (let i = 0; i < base64StrLength; i++) {
                if (i % 4) {
                    const bits1 = map.indexOf(base64Str.charAt(i - 1)) << ((i % 4) * 2);
                    const bits2 = map.indexOf(base64Str.charAt(i)) >>> (6 - (i % 4) * 2);
                    words[nBytes >>> 2] |= (bits1 | bits2) << (24 - (nBytes % 4) * 8);
                    nBytes++;
                }
            }
            return WordArray.create(words, nBytes);
        }
    };
    
    const C_algo = C.algo = {};
    const C_mode = C.mode = {};
    const C_pad = C.pad = {};
    
    // PKCS7 填充
    C_pad.Pkcs7 = {
        pad: function(data, blockSize) {
            const blockSizeBytes = blockSize * 4;
            const nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
            const paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;
            const paddingWords = [];
            for (let i = 0; i < nPaddingBytes; i += 4) {
                paddingWords.push(paddingWord);
            }
            const padding = WordArray.create(paddingWords, nPaddingBytes);
            data.concat(padding);
        },
        unpad: function(data) {
            const nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;
            data.sigBytes -= nPaddingBytes;
        }
    };
    
    // AES 核心算法
    const SBOX = [];
    const INV_SBOX = [];
    const SUB_MIX_0 = [];
    const SUB_MIX_1 = [];
    const SUB_MIX_2 = [];
    const SUB_MIX_3 = [];
    const INV_SUB_MIX_0 = [];
    const INV_SUB_MIX_1 = [];
    const INV_SUB_MIX_2 = [];
    const INV_SUB_MIX_3 = [];
    
    (function() {
        const d = [];
        for (let i = 0; i < 256; i++) {
            if (i < 128) {
                d[i] = i << 1;
            } else {
                d[i] = (i << 1) ^ 0x11b;
            }
        }
        
        let x = 0;
        let xi = 0;
        for (let i = 0; i < 256; i++) {
            let sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
            sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
            SBOX[x] = sx;
            INV_SBOX[sx] = x;
            
            const x2 = d[x];
            const x4 = d[x2];
            const x8 = d[x4];
            
            let t = (d[sx] * 0x101) ^ (sx * 0x1010100);
            SUB_MIX_0[x] = (t << 24) | (t >>> 8);
            SUB_MIX_1[x] = (t << 16) | (t >>> 16);
            SUB_MIX_2[x] = (t << 8) | (t >>> 24);
            SUB_MIX_3[x] = t;
            
            t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
            INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
            INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
            INV_SUB_MIX_2[sx] = (t << 8) | (t >>> 24);
            INV_SUB_MIX_3[sx] = t;
            
            if (!x) {
                x = xi = 1;
            } else {
                x = x2 ^ d[d[d[x8 ^ x2]]];
                xi ^= d[d[xi]];
            }
        }
    })();
    
    const RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
    
    const AES = C_algo.AES = {
        _doReset: function() {
            let t;
            const key = this._key;
            const keyWords = key.words;
            const keySize = key.sigBytes / 4;
            const nRounds = this._nRounds = keySize + 6;
            const ksRows = (nRounds + 1) * 4;
            const keySchedule = this._keySchedule = [];
            
            for (let ksRow = 0; ksRow < ksRows; ksRow++) {
                if (ksRow < keySize) {
                    keySchedule[ksRow] = keyWords[ksRow];
                } else {
                    t = keySchedule[ksRow - 1];
                    
                    if (!(ksRow % keySize)) {
                        t = (t << 8) | (t >>> 24);
                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
                        t ^= RCON[(ksRow / keySize) | 0] << 24;
                    } else if (keySize > 6 && ksRow % keySize == 4) {
                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
                    }
                    
                    keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
                }
            }
            
            const invKeySchedule = this._invKeySchedule = [];
            for (let invKsRow = 0; invKsRow < ksRows; invKsRow++) {
                const ksRow = ksRows - invKsRow;
                
                if (invKsRow % 4) {
                    t = keySchedule[ksRow];
                } else {
                    t = keySchedule[ksRow - 4];
                }
                
                if (invKsRow < 4 || ksRow <= 4) {
                    invKeySchedule[invKsRow] = t;
                } else {
                    invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
                                                INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
                }
            }
        },
        encryptBlock: function(M, offset) {
            this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
        },
        decryptBlock: function(M, offset) {
            const t = M[offset + 1];
            M[offset + 1] = M[offset + 3];
            M[offset + 3] = t;
            this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);
            const t2 = M[offset + 1];
            M[offset + 1] = M[offset + 3];
            M[offset + 3] = t2;
        },
        _doCryptBlock: function(M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
            const nRounds = this._nRounds;
            let s0 = M[offset] ^ keySchedule[0];
            let s1 = M[offset + 1] ^ keySchedule[1];
            let s2 = M[offset + 2] ^ keySchedule[2];
            let s3 = M[offset + 3] ^ keySchedule[3];
            let ksRow = 4;
            
            for (let round = 1; round < nRounds; round++) {
                const t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
                const t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
                const t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
                const t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];
                
                s0 = t0;
                s1 = t1;
                s2 = t2;
                s3 = t3;
            }
            
            const t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
            const t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
            const t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
            const t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];
            
            M[offset] = t0;
            M[offset + 1] = t1;
            M[offset + 2] = t2;
            M[offset + 3] = t3;
        },
        keySize: 256 / 32
    };
    
    // CBC 模式
    C_mode.CBC = {
        Encryptor: {
            processBlock: function(words, offset) {
                const cipher = this._cipher;
                const blockSize = cipher.blockSize;
                xorBlock.call(this, words, offset, blockSize);
                cipher.encryptBlock(words, offset);
                this._prevBlock = words.slice(offset, offset + blockSize);
            }
        },
        Decryptor: {
            processBlock: function(words, offset) {
                const cipher = this._cipher;
                const blockSize = cipher.blockSize;
                const thisBlock = words.slice(offset, offset + blockSize);
                cipher.decryptBlock(words, offset);
                xorBlock.call(this, words, offset, blockSize);
                this._prevBlock = thisBlock;
            }
        }
    };
    
    function xorBlock(words, offset, blockSize) {
        let block;
        if (this._iv) {
            block = this._iv;
            this._iv = undefined;
        } else {
            block = this._prevBlock;
        }
        
        for (let i = 0; i < blockSize; i++) {
            words[offset + i] ^= block[i];
        }
    }
    
    // AES 加密/解密接口
    C.AES = {
        encrypt: function(message, key, cfg) {
            cfg = cfg || {};
            const iv = cfg.iv;
            const mode = cfg.mode || C_mode.CBC;
            const padding = cfg.padding !== undefined ? cfg.padding : C_pad.Pkcs7;
            
            const messageWords = typeof message === 'string' ? Utf8.parse(message) : message;
            const keyWords = typeof key === 'string' ? Utf8.parse(key) : key;
            
            const cipher = Object.create(AES);
            cipher._key = keyWords;
            cipher._doReset();
            
            const blockSize = 4;
            const data = messageWords.clone();
            
            if (padding) {
                padding.pad(data, blockSize);
            }
            
            const dataWords = data.words;
            const dataSigBytes = data.sigBytes;
            const modeCreator = mode.Encryptor;
            
            const modeInstance = Object.create(modeCreator);
            modeInstance._cipher = cipher;
            modeInstance._iv = iv ? iv.words.slice(0) : null;
            modeInstance._prevBlock = iv ? iv.words.slice(0) : [0, 0, 0, 0];
            
            for (let offset = 0; offset < dataSigBytes / 4; offset += blockSize) {
                modeInstance.processBlock(dataWords, offset);
            }
            
            return {
                ciphertext: data,
                key: keyWords,
                iv: iv,
                toString: function(encoder) {
                    return (encoder || Base64).stringify(this.ciphertext);
                }
            };
        },
        decrypt: function(ciphertext, key, cfg) {
            cfg = cfg || {};
            const iv = cfg.iv;
            const mode = cfg.mode || C_mode.CBC;
            const padding = cfg.padding !== undefined ? cfg.padding : C_pad.Pkcs7;
            
            const ciphertextWords = typeof ciphertext === 'object' && ciphertext.ciphertext ? ciphertext.ciphertext : ciphertext;
            const keyWords = typeof key === 'string' ? Utf8.parse(key) : key;
            
            const cipher = Object.create(AES);
            cipher._key = keyWords;
            cipher._doReset();
            
            const blockSize = 4;
            const data = ciphertextWords.clone();
            const dataWords = data.words;
            const dataSigBytes = data.sigBytes;
            
            const modeCreator = mode.Decryptor;
            const modeInstance = Object.create(modeCreator);
            modeInstance._cipher = cipher;
            modeInstance._iv = iv ? iv.words.slice(0) : null;
            modeInstance._prevBlock = iv ? iv.words.slice(0) : [0, 0, 0, 0];
            
            for (let offset = 0; offset < dataSigBytes / 4; offset += blockSize) {
                modeInstance.processBlock(dataWords, offset);
            }
            
            if (padding) {
                padding.unpad(data);
            }
            
            return data;
        }
    };
    
    C.lib.WordArray = WordArray;
    C.enc.Utf8 = Utf8;
    C.enc.Base64 = Base64;
    C.mode.CBC = C_mode.CBC;
    C.pad.Pkcs7 = C_pad.Pkcs7;
    
    return C;
})();

// ============ 配置区域 ============
const CONFIG = {
    // 设置要过滤的时间区间（格式：YYYYMMDDHHmmss）
    startTime: "20251014000000",  // 开始时间
    endTime: "20251014235959",    // 结束时间
    
    // 过滤模式：
    // "delete" - 删除时间区间内的账单
    // "keep" - 只保留时间区间内的账单
    filterMode: "delete",
    
    // 是否启用日志
    enableLog: true
};

// AES 密钥和IV（从decode_test.py中获取）
const KEY_WORDS = [808727361, 1330726731, 913927019, 1819892289];
const IV_WORDS = [808727361, 1330726731, 913927019, 1819892289];

// ============ 工具函数 ============

// 日志函数
function log(message) {
    if (CONFIG.enableLog) {
        console.log(`[账单拦截] ${message}`);
    }
}

// 将CryptoJS的WordArray转换为字节数组
function wordsToBytes(words, sigBytes) {
    let bytes = [];
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        bytes.push((word >>> 24) & 0xFF);
        bytes.push((word >>> 16) & 0xFF);
        bytes.push((word >>> 8) & 0xFF);
        bytes.push(word & 0xFF);
    }
    return bytes.slice(0, sigBytes);
}

// Base64解码
function base64Decode(str) {
    return CryptoJS.enc.Base64.parse(str);
}

// Base64编码
function base64Encode(wordArray) {
    return CryptoJS.enc.Base64.stringify(wordArray);
}

// AES解密函数
function aesDecrypt(encryptedData) {
    try {
        // 第一次Base64解码
        let decodedOnce = base64Decode(encryptedData);
        let decodedOnceStr = CryptoJS.enc.Utf8.stringify(decodedOnce);
        
        // 第二次Base64解码得到密文
        let ciphertext = base64Decode(decodedOnceStr);
        
        // 构建密钥和IV
        let keyBytes = wordsToBytes(KEY_WORDS, 16);
        let ivBytes = wordsToBytes(IV_WORDS, 16);
        
        let key = CryptoJS.lib.WordArray.create(keyBytes);
        let iv = CryptoJS.lib.WordArray.create(ivBytes);
        
        // 解密
        let decrypted = CryptoJS.AES.decrypt(
            { ciphertext: ciphertext },
            key,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        
        return CryptoJS.enc.Utf8.stringify(decrypted);
    } catch (e) {
        log(`解密失败: ${e.message}`);
        return null;
    }
}

// AES加密函数
function aesEncrypt(plaintext) {
    try {
        // 构建密钥和IV
        let keyBytes = wordsToBytes(KEY_WORDS, 16);
        let ivBytes = wordsToBytes(IV_WORDS, 16);
        
        let key = CryptoJS.lib.WordArray.create(keyBytes);
        let iv = CryptoJS.lib.WordArray.create(ivBytes);
        
        // 加密
        let encrypted = CryptoJS.AES.encrypt(
            plaintext,
            key,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        
        // 获取密文的Base64
        let ciphertextBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
        
        // 第二次Base64编码
        let secondEncode = CryptoJS.enc.Utf8.parse(ciphertextBase64);
        let finalResult = CryptoJS.enc.Base64.stringify(secondEncode);
        
        return finalResult;
    } catch (e) {
        log(`加密失败: ${e.message}`);
        return null;
    }
}

// 时间比较函数
function isInTimeRange(createTime, startTime, endTime) {
    return createTime >= startTime && createTime <= endTime;
}

// 过滤账单数据
function filterOrderInfo(orderInfo) {
    if (!orderInfo || !Array.isArray(orderInfo)) {
        return orderInfo;
    }
    
    let filteredOrders = orderInfo.filter(order => {
        let createTime = order.createTime || "";
        let inRange = isInTimeRange(createTime, CONFIG.startTime, CONFIG.endTime);
        
        if (CONFIG.filterMode === "delete") {
            // 删除模式：保留不在时间区间内的
            return !inRange;
        } else {
            // 保留模式：只保留在时间区间内的
            return inRange;
        }
    });
    
    log(`原始账单数量: ${orderInfo.length}, 过滤后: ${filteredOrders.length}`);
    
    return filteredOrders;
}

// ============ 主函数 ============

function modifyResponse(response) {
    try {
        log("开始处理响应...");
        
        // 解析响应
        let body = JSON.parse(response.body);
        
        // 检查响应结构
        if (!body.data || !body.data.outParam) {
            log("响应数据结构不正确");
            return response;
        }
        
        // 获取加密的数据
        let encryptedData = body.data.outParam;
        log(`加密数据: ${encryptedData.substring(0, 50)}...`);
        
        // 解密
        let decryptedStr = aesDecrypt(encryptedData);
        if (!decryptedStr) {
            log("解密失败，返回原始响应");
            return response;
        }
        
        log("解密成功");
        
        // 解析解密后的JSON
        let decryptedData = JSON.parse(decryptedStr);
        
        // 过滤账单
        if (decryptedData.orderInfo) {
            let originalCount = decryptedData.orderInfo.length;
            decryptedData.orderInfo = filterOrderInfo(decryptedData.orderInfo);
            let filteredCount = decryptedData.orderInfo.length;
            
            // 更新总数
            decryptedData.totalCount = filteredCount.toString();
            
            log(`账单过滤完成: ${originalCount} -> ${filteredCount}`);
            log(`时间区间: ${CONFIG.startTime} - ${CONFIG.endTime}`);
            log(`过滤模式: ${CONFIG.filterMode}`);
        }
        
        // 重新加密
        let modifiedJson = JSON.stringify(decryptedData);
        let reencrypted = aesEncrypt(modifiedJson);
        
        if (!reencrypted) {
            log("重新加密失败，返回原始响应");
            return response;
        }
        
        log("重新加密成功");
        
        // 替换响应数据
        body.data.outParam = reencrypted;
        response.body = JSON.stringify(body);
        
        log("响应修改完成");
        
    } catch (e) {
        log(`处理出错: ${e.message}`);
        log(`错误堆栈: ${e.stack}`);
    }
    
    return response;
}

// ============ 圈X入口 ============

// 检测是否是目标请求
if ($request.url.indexOf("orderlistqryv3") !== -1) {
    log("检测到账单查询请求");
    
    // 获取响应
    let response = $response;
    
    // 修改响应
    response = modifyResponse(response);
    
    // 返回修改后的响应
    $done(response);
} else {
    $done({});
}

