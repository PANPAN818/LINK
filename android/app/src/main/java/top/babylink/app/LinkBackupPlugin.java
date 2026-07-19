package top.babylink.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.widget.Toast;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(
    name = "LinkBackup",
    permissions = {
        @Permission(alias = "storage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE })
    }
)
public class LinkBackupPlugin extends Plugin {
    private static final int MAX_ENCODED_ARCHIVE_LENGTH = 192 * 1024 * 1024;

    @PluginMethod
    public void saveArchive(PluginCall call) {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermissionCallback");
            return;
        }
        saveArchiveData(call);
    }

    @PermissionCallback
    private void storagePermissionCallback(PluginCall call) {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P
            && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            call.reject("需要存储权限才能导出备份。");
            return;
        }
        saveArchiveData(call);
    }

    private void saveArchiveData(PluginCall call) {
        String dataUrl = call.getString("dataUrl", "");
        String requestedName = call.getString("fileName", "link-backup.zip");
        int commaIndex = dataUrl.indexOf(',');
        if (!dataUrl.startsWith("data:application/zip") || commaIndex < 0 || dataUrl.length() > MAX_ENCODED_ARCHIVE_LENGTH) {
            call.reject("备份数据无效或超过 144MB。");
            return;
        }

        String fileName = sanitizeFileName(requestedName);
        getBridge().execute(() -> {
            try {
                byte[] bytes = Base64.decode(dataUrl.substring(commaIndex + 1), Base64.DEFAULT);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) saveWithMediaStore(bytes, fileName);
                else saveLegacy(bytes, fileName);
                getActivity().runOnUiThread(() -> Toast.makeText(getContext(), "备份已保存到下载目录", Toast.LENGTH_SHORT).show());
                JSObject result = new JSObject();
                result.put("saved", true);
                result.put("fileName", fileName);
                call.resolve(result);
            } catch (IllegalArgumentException error) {
                call.reject("备份数据无法解码。", error);
            } catch (Exception error) {
                call.reject("备份保存失败。", error);
            }
        });
    }

    private void saveWithMediaStore(byte[] bytes, String fileName) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
        values.put(MediaStore.Downloads.MIME_TYPE, "application/zip");
        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/BabyLink");
        values.put(MediaStore.Downloads.IS_PENDING, 1);
        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) throw new IllegalStateException("无法创建系统备份文件。");
        try {
            try (OutputStream output = resolver.openOutputStream(uri)) {
                if (output == null) throw new IllegalStateException("无法打开系统备份文件。");
                output.write(bytes);
            }
            values.clear();
            values.put(MediaStore.Downloads.IS_PENDING, 0);
            resolver.update(uri, values, null, null);
        } catch (Exception error) {
            resolver.delete(uri, null, null);
            throw error;
        }
    }

    @SuppressWarnings("deprecation")
    private void saveLegacy(byte[] bytes, String fileName) throws Exception {
        File directory = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "BabyLink");
        if (!directory.exists() && !directory.mkdirs()) throw new IllegalStateException("无法创建备份目录。");
        File backupFile = uniqueFile(directory, fileName);
        try (FileOutputStream output = new FileOutputStream(backupFile)) {
            output.write(bytes);
        }
        MediaScannerConnection.scanFile(getContext(), new String[] { backupFile.getAbsolutePath() }, new String[] { "application/zip" }, null);
    }

    private static File uniqueFile(File directory, String fileName) {
        File candidate = new File(directory, fileName);
        if (!candidate.exists()) return candidate;
        String stem = fileName.substring(0, fileName.length() - 4);
        for (int index = 2; index < 10_000; index += 1) {
            candidate = new File(directory, stem + "-" + index + ".zip");
            if (!candidate.exists()) return candidate;
        }
        return new File(directory, stem + "-" + System.currentTimeMillis() + ".zip");
    }

    private static String sanitizeFileName(String requestedName) {
        String fileName = requestedName == null ? "" : requestedName.trim().replaceAll("[\\\\/:*?\"<>|]+", "-");
        if (fileName.isEmpty()) fileName = "link-backup";
        if (!fileName.matches("(?i).*\\.zip$")) fileName += ".zip";
        return fileName.length() > 160 ? fileName.substring(fileName.length() - 160) : fileName;
    }
}
