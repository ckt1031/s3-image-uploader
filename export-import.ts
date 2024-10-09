import S3UploaderPlugin, {S3UploaderSettings} from "./main";
import {App, Modal, Notice, Setting, TextComponent} from "obsidian";

export const exportDataUri = (settings: S3UploaderSettings) => {
	return encodeURIComponent(JSON.stringify(settings));
};

export interface ProcessQrCodeResultType {
	status: "error" | "ok";
	message: string;
	result?: S3UploaderSettings;
}

export const importFromDataUri = async (
	plugin: S3UploaderPlugin,
	inputParams: string
): Promise<ProcessQrCodeResultType> => {
	let settings = {} as S3UploaderSettings;
	try {
		settings = JSON.parse(decodeURIComponent(inputParams));
		plugin.settings = Object.assign({}, plugin.settings, settings);
		await plugin.saveSettings();
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

export class ImportSettingsModal extends Modal {
	data: string;
	plugin: S3UploaderPlugin;

	constructor(app: App, plugin: S3UploaderPlugin) {
		super(app);
		this.plugin = plugin;
		this.data = "";
	}

	async onOpen() {
		const { contentEl, data } = this;

		const div1 = contentEl.createDiv();

		div1.createEl("p", {
			text: "Paste the settings data here:",
		});

		new Setting(contentEl)
			.setName("String:")
			.addText((text: TextComponent) => {
				text.setPlaceholder("Name (example: text-tone-helper)");
				text.onChange((value: string) => {
					this.data = value;
				});
				text.setValue(data);
			});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Confirm")
				.setCta()
				.onClick(async () => {
					await this.submitForm();
				})
		);
	}

	async submitForm() {
		const { data } = this;
		const result = await importFromDataUri(this.plugin, data);
		if (result.status === "ok") {
			new Notice("Settings imported successfully");
			this.close();
		} else {
			new Notice(result.message);
		}
		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
