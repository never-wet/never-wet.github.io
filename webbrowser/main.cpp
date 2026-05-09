#include <QApplication>
#include <QMainWindow>
#include <QWebEngineView>
#include <QWebEnginePage>
#include <QTabWidget>
#include <QLineEdit>
#include <QPushButton>
#include <QToolBar>
#include <QVBoxLayout>
#include <QIcon>
#include <QAction>

class BrowserWindow : public QMainWindow {
    Q_OBJECT

public:
    BrowserWindow() {
        setWindowTitle("VibeBrowser");
        resize(1280, 800);

        // 1. Apply Dark Mode Stylesheet
        setStyleSheet(R"(
            QMainWindow { background-color: #1A1B1E; }
            QTabWidget::pane { border: none; }
            QTabBar::tab {
                background: #2C2E33; color: #888;
                padding: 8px 20px; border-radius: 4px;
                margin-right: 2px;
            }
            QTabBar::tab:selected {
                background: #3B3E45; color: #FFF;
            }
            QLineEdit {
                background-color: #2C2E33; color: #FFF;
                border: 1px solid #373A40; border-radius: 15px;
                padding: 5px 15px; font-size: 14px;
            }
            QToolBar { border: none; background: #1A1B1E; spacing: 5px; }
            QPushButton {
                background: transparent; color: #FFF; border: none;
                font-weight: bold; font-size: 16px; padding: 5px 10px;
            }
            QPushButton:hover { background: #3B3E45; border-radius: 4px; }
        )");

        // 2. Setup Toolbar (Navigation & Search)
        auto *toolbar = new QToolBar(this);
        toolbar->setMovable(false);
        addToolBar(toolbar);

        auto *backBtn = new QPushButton("<");
        auto *fwdBtn = new QPushButton(">");
        auto *reloadBtn = new QPushButton("↻");
        auto *newTabBtn = new QPushButton("+");
        
        urlBar = new QLineEdit();
        urlBar->setPlaceholderText("Search or enter address...");

        toolbar->addWidget(backBtn);
        toolbar->addWidget(fwdBtn);
        toolbar->addWidget(reloadBtn);
        toolbar->addWidget(urlBar);
        toolbar->addWidget(newTabBtn);

        // 3. Setup Tabs
        tabWidget = new QTabWidget(this);
        tabWidget->setTabsClosable(true);
        setCentralWidget(tabWidget);

        // 4. Connect Signals (Making the buttons actually do things)
        connect(backBtn, &QPushButton::clicked, this, [this]() { currentWebView()->back(); });
        connect(fwdBtn, &QPushButton::clicked, this, [this]() { currentWebView()->forward(); });
        connect(reloadBtn, &QPushButton::clicked, this, [this]() { currentWebView()->reload(); });
        connect(newTabBtn, &QPushButton::clicked, this, [this]() { addTab("https://www.google.com"); });
        connect(urlBar, &QLineEdit::returnPressed, this, &BrowserWindow::handleUrlEntered);
        connect(tabWidget, &QTabWidget::tabCloseRequested, this, &BrowserWindow::closeTab);
        connect(tabWidget, &QTabWidget::currentChanged, this, &BrowserWindow::updateUrlBar);

        // 5. Open initial tab
        addTab("https://www.google.com");
    }

private:
    QTabWidget *tabWidget;
    QLineEdit *urlBar;

    // Helper to get the currently active web page
    QWebEngineView* currentWebView() {
        return qobject_cast<QWebEngineView*>(tabWidget->currentWidget());
    }

    // Function to add a new tab
    void addTab(const QString &url) {
        auto *webView = new QWebEngineView();
        webView->load(QUrl(url));

        int index = tabWidget->addTab(webView, "Loading...");
        tabWidget->setCurrentIndex(index);

        // When the page finishes loading, update the tab title
        connect(webView, &QWebEngineView::titleChanged, this, [this, webView](const QString &title) {
            int idx = tabWidget->indexOf(webView);
            if (idx != -1) tabWidget->setTabText(idx, title.left(20) + "...");
        });

        // When the page URL changes (e.g., clicking a link), update the search bar
        connect(webView, &QWebEngineView::urlChanged, this, [this, webView](const QUrl &newUrl) {
            if (currentWebView() == webView) {
                urlBar->setText(newUrl.toString());
            }
        });
    }

    void closeTab(int index) {
        if (tabWidget->count() > 1) {
            tabWidget->widget(index)->deleteLater();
            tabWidget->removeTab(index);
        } else {
            close(); // Close the whole browser if the last tab is closed
        }
    }

    void handleUrlEntered() {
        QString input = urlBar->text();
        if (!input.startsWith("http://") && !input.startsWith("https://")) {
            if (input.contains(".") && !input.contains(" ")) {
                input = "https://" + input; // Assume it's a domain like "reddit.com"
            } else {
                input = "https://www.google.com/search?q=" + input; // Otherwise, Google search it
            }
        }
        currentWebView()->load(QUrl(input));
    }

    void updateUrlBar() {
        if (currentWebView()) {
            urlBar->setText(currentWebView()->url().toString());
        }
    }
};

int main(int argc, char *argv[]) {
    QCoreApplication::setAttribute(Qt::AA_ShareOpenGLContexts);
    QApplication app(argc, argv);

    BrowserWindow browser;
    browser.show();

    return app.exec();
}

#include "main.moc"