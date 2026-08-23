const SUPPORTED_IMAGE_FORMATS = [
	{ extension: "jpg", mimeType: "image/jpeg" },
	{ extension: "jpeg", mimeType: "image/jpeg" },
	{ extension: "png", mimeType: "image/png" },
	{ extension: "gif", mimeType: "image/gif" },
	{ extension: "webp", mimeType: "image/webp" },
] as const;

export const IMAGE_FILE_ACCEPT = [
	...new Set(
		SUPPORTED_IMAGE_FORMATS.map(({ extension }) => `.${extension}`),
	),
	...new Set(SUPPORTED_IMAGE_FORMATS.map(({ mimeType }) => mimeType)),
].join(",");

export function isSupportedImageFile(file: File): boolean {
	const extension = file.name.split(".").pop()?.toLowerCase();
	const mimeType = file.type.toLowerCase();

	return SUPPORTED_IMAGE_FORMATS.some(
		(format) =>
			format.extension === extension && format.mimeType === mimeType,
	);
}
