import { enc, HmacSHA256, SHA256 } from "crypto-js";
import WordArray from "crypto-js/lib-typedarrays";

function SigV4Utils() {}
SigV4Utils.sign = function (key: WordArray, msg: string) {
	const hash = HmacSHA256(msg, key);
	return hash.toString(enc.Hex);
};
SigV4Utils.sha256 = function (msg: string) {
	const hash = SHA256(msg);
	return hash.toString(enc.Hex);
};
SigV4Utils.getSignatureKey = function (
	key: string,
	dateStamp: string,
	regionName: string,
	serviceName: string
) {
	const kDate = HmacSHA256(dateStamp, 'AWS4' + key);
	const kRegion = HmacSHA256(regionName, kDate);
	const kService = HmacSHA256(serviceName, kRegion);
	const kSigning = HmacSHA256('aws4_request', kService);
	return kSigning;
};

export { SigV4Utils };