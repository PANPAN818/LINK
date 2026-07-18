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
		super.onCreate(savedInstanceState);
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
