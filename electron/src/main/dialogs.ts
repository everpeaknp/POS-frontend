import { dialog, BrowserWindow, shell } from "electron";

export async function openFileDialog(
  win: BrowserWindow | null,
  options?: Electron.OpenDialogOptions
) {
  const result = await dialog.showOpenDialog(win ?? undefined!, {
    properties: ["openFile"],
    ...options,
  });
  return result;
}

export async function saveFileDialog(
  win: BrowserWindow | null,
  options?: Electron.SaveDialogOptions
) {
  const result = await dialog.showSaveDialog(win ?? undefined!, {
    ...options,
  });
  return result;
}

export async function messageBox(
  win: BrowserWindow | null,
  options: Electron.MessageBoxOptions
) {
  return dialog.showMessageBox(win ?? undefined!, options);
}

export async function openExternal(url: string) {
  // Block dangerous schemes
  if (!/^https?:/i.test(url) && !/^mailto:/i.test(url)) {
    throw new Error("Blocked external URL scheme");
  }
  await shell.openExternal(url);
}
