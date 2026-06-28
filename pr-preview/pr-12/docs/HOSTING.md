# GitHub Pages への自動デプロイ

`main` ブランチに push すると GitHub Actions が GitHub Pages に自動デプロイします。

前提: このアプリは静的サイト（HTML/CSS/JS）。ビルド工程はありません。
PWA（Service Worker）は HTTPS が必須ですが、GitHub Pages は HTTPS が自動で付きます。

---

## セットアップ（初回のみ）

リポジトリの Settings → Pages → Source を **GitHub Actions** に設定するだけ。
（`gh` CLIなら↓で一発）

```bash
gh api repos/{owner}/{repo}/pages -X POST -f build_type=workflow
```

あとは `main` に push すれば `.github/workflows/deploy-pages.yml` が自動でデプロイします。

---

## 公開URL

`https://{owner}.github.io/kidsLearningApp/`

> **注**: GitHub Pages を Private リポジトリで使うには **GitHub Pro** 以上のプランが必要です。
> Free プランの場合はリポジトリを Public にするか、プランをアップグレードしてください。

---

## 独自ドメインを使う場合

リポジトリの Settings → Pages → Custom domain で設定できます（DNS に CNAME レコード追加が必要）。
