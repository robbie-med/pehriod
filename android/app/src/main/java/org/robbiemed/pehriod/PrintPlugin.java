package org.robbiemed.pehriod;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.WebView;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * window.print() does nothing inside an Android WebView. This opens the system print
 * dialog for the current page, which also offers "Save as PDF".
 */
@CapacitorPlugin(name = "PehriodPrint")
public class PrintPlugin extends Plugin {

    @PluginMethod
    public void print(PluginCall call) {
        String name = call.getString("name", "Pehriod");
        getActivity().runOnUiThread(() -> {
            WebView webView = getBridge().getWebView();
            PrintManager printManager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
            printManager.print(name, webView.createPrintDocumentAdapter(name), new PrintAttributes.Builder().build());
            call.resolve();
        });
    }
}
