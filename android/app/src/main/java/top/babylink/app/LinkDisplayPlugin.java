package top.babylink.app;

import android.app.Activity;
import android.content.Context;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LinkDisplay")
public class LinkDisplayPlugin extends Plugin {
    private static final String PREFERENCES = "link_display";
    private static final String FULLSCREEN_KEY = "fullscreen_enabled";

    @PluginMethod
    public void setFullscreen(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        getContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(FULLSCREEN_KEY, enabled)
            .apply();
        getActivity().runOnUiThread(() -> {
            applyFullscreen(getActivity(), enabled);
            JSObject result = new JSObject();
            result.put("enabled", enabled);
            call.resolve(result);
        });
    }

    static void applyStoredFullscreen(Activity activity) {
        boolean enabled = activity.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
            .getBoolean(FULLSCREEN_KEY, false);
        applyFullscreen(activity, enabled);
    }

    private static void applyFullscreen(Activity activity, boolean enabled) {
        Window window = activity.getWindow();
        View decorView = window.getDecorView();
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        if (enabled) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
            window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            controller.hide(WindowInsetsCompat.Type.statusBars());
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            controller.show(WindowInsetsCompat.Type.statusBars());
        }
        decorView.post(() -> {
            WindowInsetsControllerCompat postedController = WindowCompat.getInsetsController(window, decorView);
            postedController.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            if (enabled) postedController.hide(WindowInsetsCompat.Type.statusBars());
            else postedController.show(WindowInsetsCompat.Type.statusBars());
        });
    }
}