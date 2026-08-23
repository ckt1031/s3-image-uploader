import { App, SecretComponent, Setting } from "obsidian";

export interface S3SecretReferences {
	accessKeySecretId: string;
	secretKeySecretId: string;
}

const ACCESS_KEY_SECRET_ID = "s3-image-uploader-access-key";
const SECRET_KEY_SECRET_ID = "s3-image-uploader-secret-key";

export function migrateS3Secrets(
	app: App,
	data: Record<string, unknown> | null,
): { data: Record<string, unknown>; migrated: boolean } {
	const migratedData = { ...(data ?? {}) };
	const legacyAccessKey = getString(migratedData.accessKey);
	const legacySecretKey = getString(migratedData.secretKey);
	let migrated = false;

	if (legacyAccessKey) {
		if (!app.secretStorage.getSecret(ACCESS_KEY_SECRET_ID)) {
			app.secretStorage.setSecret(ACCESS_KEY_SECRET_ID, legacyAccessKey);
		}
		migratedData.accessKeySecretId =
			getString(migratedData.accessKeySecretId) || ACCESS_KEY_SECRET_ID;
		migrated = true;
	}

	if (legacySecretKey) {
		if (!app.secretStorage.getSecret(SECRET_KEY_SECRET_ID)) {
			app.secretStorage.setSecret(SECRET_KEY_SECRET_ID, legacySecretKey);
		}
		migratedData.secretKeySecretId =
			getString(migratedData.secretKeySecretId) || SECRET_KEY_SECRET_ID;
		migrated = true;
	}

	if ("accessKey" in migratedData || "secretKey" in migratedData) {
		delete migratedData.accessKey;
		delete migratedData.secretKey;
		migrated = true;
	}

	return { data: migratedData, migrated };
}

export function getS3Credentials(
	app: App,
	settings: S3SecretReferences,
): { accessKeyId: string; secretAccessKey: string } | null {
	if (!settings.accessKeySecretId || !settings.secretKeySecretId) {
		return null;
	}

	const accessKeyId = app.secretStorage.getSecret(settings.accessKeySecretId);
	const secretAccessKey = app.secretStorage.getSecret(
		settings.secretKeySecretId,
	);

	if (!accessKeyId || !secretAccessKey) {
		return null;
	}

	return { accessKeyId, secretAccessKey };
}

export function addS3SecretSettings(
	app: App,
	containerEl: HTMLElement,
	settings: S3SecretReferences,
	onChange: (
		key: keyof S3SecretReferences,
		value: string,
	) => void | Promise<void>,
): void {
	addSecretSetting(
		app,
		containerEl,
		"AWS Access Key ID",
		"Select or create the AWS access key ID in Secret Storage.",
		settings.accessKeySecretId,
		(value) => onChange("accessKeySecretId", value),
	);
	addSecretSetting(
		app,
		containerEl,
		"AWS Secret Key",
		"Select or create the AWS secret key in Secret Storage.",
		settings.secretKeySecretId,
		(value) => onChange("secretKeySecretId", value),
	);
}

function addSecretSetting(
	app: App,
	containerEl: HTMLElement,
	name: string,
	desc: string,
	value: string,
	onChange: (value: string) => void | Promise<void>,
): void {
	new Setting(containerEl)
		.setName(name)
		.setDesc(desc)
		.addComponent((element) =>
			new SecretComponent(app, element)
				.setValue(value)
				.onChange(onChange),
		);
}

function getString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}
