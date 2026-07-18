package top.babylink.app;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	private static final String APP_HOME_URL = "https://babylink.top/home";

	@Override
	public void onCreate(Bundle savedInstanceState) {
		registerPlugin(LinkUpdaterPlugin.class);
		registerPlugin(LinkKeepAlivePlugin.class);
		registerPlugin(LinkDisplayPlugin.class);
		super.onCreate(savedInstanceState);
		LinkDisplayPlugin.applyStoredFullscreen(this);
		getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
			@Override
			public void handleOnBackPressed() {
				WebView webView = getBridge() == null ? null : getBridge().getWebView();
				if (webView == null) return;
				String currentUrl = webView.getUrl();
				String path = currentUrl == null ? null : Uri.parse(currentUrl).getPath();
				if (isRootPath(path)) return;
				if (webView.canGoBack()) webView.goBack();
				else webView.loadUrl(APP_HOME_URL);
			}
		});
	}

	@Override
	protected void onResume() {
		super.onResume();
		LinkDisplayPlugin.applyStoredFullscreen(this);
	}

	@Override
	public void onWindowFocusChanged(boolean hasFocus) {
		super.onWindowFocusChanged(hasFocus);
		if (hasFocus) LinkDisplayPlugin.applyStoredFullscreen(this);
	}

	static boolean isRootPath(String path) {
		return path == null
			|| path.isEmpty()
			|| "/".equals(path)
			|| "/home".equals(path)
			|| "/home/".equals(path)
			|| "/access".equals(path)
			|| "/access/".equals(path);
	}
}
