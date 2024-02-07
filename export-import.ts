import QRCode from "qrcode";
import manifest from "./manifest.json";
import { S3UploaderSettings } from "./main";
import { Modal, App, Notice } from "obsidian";
import CryptoJS from "crypto-js";

export interface UriParams {
	func?: string;
	vault?: string;
	ver?: string;
	data?: string;
}

const ENCRYPT_KEY = "DKH24E4Xr8AfcZz24n6BCyew6f63"

const encryptBrowser = (text: string, key: string) => {
	return CryptoJS.AES.encrypt(text, key).toString();
};

const decryptBrowser = (encrypted: string, key: string) => {
	const bytes = CryptoJS.AES.decrypt(encrypted, key);
	return bytes.toString(CryptoJS.enc.Utf8);
};

export const exportQrCodeUri = async (
	settings: S3UploaderSettings,
	currentVaultName: string
) => {
	const vault = encodeURIComponent(currentVaultName);
  const data = encodeURIComponent(encryptBrowser(JSON.stringify(settings), ENCRYPT_KEY));
	const rawUri = `obsidian://${manifest.id}?func=imports3uploader&version=${manifest.version}&vault=${vault}&data=${data}`;
	const imgUri = await QRCode.toDataURL(rawUri);
	return {
		rawUri,
		imgUri,
	};
};

export interface ProcessQrCodeResultType {
	status: "error" | "ok";
	message: string;
	result?: S3UploaderSettings;
}

export const importQrCodeUri = (
	inputParams: unknown,
	currentVaultName: string
): ProcessQrCodeResultType => {
	const params = inputParams as UriParams;
	if (
		params.func === undefined ||
		params.func !== "imports3uploader" ||
		params.vault === undefined ||
		params.data === undefined
	) {
		return {
			status: "error",
			message: `The uri is not for exporting/importing settings: ${JSON.stringify(
				inputParams
			)}`,
		};
	}

	if (params.vault !== currentVaultName) {
		return {
			status: "error",
			message: `The target vault is ${
				params.vault
			} but you are currently in ${currentVaultName}: ${JSON.stringify(
				inputParams
			)}`,
		};
	}

	let settings = {} as S3UploaderSettings;
	try {
		settings = JSON.parse(decryptBrowser(decodeURIComponent(params.data), ENCRYPT_KEY));
	} catch (e) {
		return {
			status: "error",
			message: `Errors while parsing settings: ${JSON.stringify(
				inputParams
			)}`,
		};
	}
	return {
		status: "ok",
		message: "OK",
		result: settings,
	};
};

export class ExportSettingsQrCodeModal extends Modal {
	plugin: S3UploaderSettings;

	constructor(app: App, plugin: S3UploaderSettings) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
		const { contentEl } = this;

		const { rawUri, imgUri } = await exportQrCodeUri(
			this.plugin,
			this.app.vault.getName()
		);

		const div1 = contentEl.createDiv();

		div1.createEl("p", {
			text: "Scan the QR code with your mobile device to import the settings",
		});

		const div2 = contentEl.createDiv();
		div2.createEl(
			"button",
			{
				text: "Copy URI",
			},
			(el) => {
				el.onclick = async () => {
					await navigator.clipboard.writeText(rawUri);
					new Notice("URI copied to clipboard");
				};
			}
		);

		const div3 = contentEl.createDiv();
		div3.createEl(
			"img",
			{
				cls: "qrcode-img",
			},
			async (el) => {
				el.src = imgUri;
			}
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
