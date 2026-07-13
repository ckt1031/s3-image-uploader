import encodeJPEG, { init as initEncodeJPEG } from "@jsquash/jpeg/encode";
import optimisePNG, { init as initEncodePNG } from "@jsquash/oxipng/optimise";

import JPEG_ENC_WASM from "./node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm";
// @ts-expect-error esbuild's wasm loader imports this as a data URL.
import PNG_WASM from "./node_modules/@jsquash/oxipng/codec/pkg/squoosh_oxipng_bg.wasm";

const MAX_IMAGE_WIDTH_OR_HEIGHT = 4096;

export type CompressedImage = {
	buffer: ArrayBuffer;
	type: "image/jpeg" | "image/png";
	extension: "jpg" | "png";
};

void (
	initEncodeJPEG as (
		module?: WebAssembly.Module,
		moduleOptionOverrides?: { locateFile: () => string },
	) => Promise<void>
)(undefined, { locateFile: () => JPEG_ENC_WASM });
void initEncodePNG(PNG_WASM);

export async function compressImage(file: File): Promise<CompressedImage> {
	const imageData = await readImageData(file, MAX_IMAGE_WIDTH_OR_HEIGHT);

	if (hasTransparency(imageData)) {
		return {
			buffer: await optimisePNG(imageData, {
				level: 3,
				optimiseAlpha: true,
			}),
			type: "image/png",
			extension: "png",
		};
	}

	return {
		buffer: await encodeJPEG(imageData, {
			quality: 75,
			trellis_multipass: true,
			optimize_coding: true,
			auto_subsample: true,
			quant_table: 3,
		}),
		type: "image/jpeg",
		extension: "jpg",
	};
}

async function readImageData(
	file: File,
	maxWidthOrHeight: number,
): Promise<ImageData> {
	const bitmap = await createImageBitmap(file);
	try {
		const scale = Math.min(
			1,
			maxWidthOrHeight / Math.max(bitmap.width, bitmap.height),
		);
		const width = Math.max(1, Math.round(bitmap.width * scale));
		const height = Math.max(1, Math.round(bitmap.height * scale));
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;

		const context = canvas.getContext("2d", { willReadFrequently: true });
		if (!context) {
			throw new Error("Could not create image canvas");
		}

		context.drawImage(bitmap, 0, 0, width, height);
		return context.getImageData(0, 0, width, height);
	} finally {
		bitmap.close();
	}
}

function hasTransparency(imageData: ImageData): boolean {
	for (let i = 3; i < imageData.data.length; i += 4) {
		if (imageData.data[i] !== 255) {
			return true;
		}
	}

	return false;
}
