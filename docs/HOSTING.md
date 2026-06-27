# Firebase Hosting への自動デプロイ設定

`main` ブランチに push すると GitHub Actions が Firebase Hosting に自動デプロイします。
最初に一度だけ、下記のセットアップが必要です（**johnny さん側で実行**）。

前提: このアプリは静的サイト（HTML/CSS/JS）。ビルド工程はありません。
PWA（Service Worker）は HTTPS が必須ですが、Firebase Hosting は HTTPS が自動で付きます。

---

## 1. Firebase プロジェクトを用意する

[Firebase コンソール](https://console.firebase.google.com/) でプロジェクトを作成（既存のGCPプロジェクトをFirebaseに追加してもOK）。
左メニューの **Hosting** を一度開いて有効化しておく。

作成したら **プロジェクトID** をメモする（例: `hiragana-kids-12345`）。

---

## 2. ローカルから初回デプロイ（任意・動作確認用）

```bash
npm install -g firebase-tools
firebase login

# .firebaserc のプロジェクトIDを書き換えてから:
firebase deploy --only hosting --project YOUR_FIREBASE_PROJECT_ID
```

成功すると `https://YOUR_FIREBASE_PROJECT_ID.web.app` で公開されます。

---

## 3. GitHub 自動デプロイの設定

`gcloud` と `gh` が使える前提のコマンド例です。
`PROJECT_ID` を自分のプロジェクトIDに置き換えてから、このリポジトリ内で実行してください。

```bash
PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
SA="github-hosting-deployer"

# 必要なAPIを有効化
gcloud services enable firebasehosting.googleapis.com firebase.googleapis.com --project "$PROJECT_ID"

# デプロイ用サービスアカウントを作成
gcloud iam service-accounts create "$SA" \
  --display-name="GitHub Actions Hosting Deployer" --project "$PROJECT_ID"

# Hosting管理権限を付与
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/firebasehosting.admin"

# 鍵を発行してGitHubシークレット／変数に登録
gcloud iam service-accounts keys create key.json \
  --iam-account="${SA}@${PROJECT_ID}.iam.gserviceaccount.com"
gh secret   set FIREBASE_SERVICE_ACCOUNT < key.json
gh variable set FIREBASE_PROJECT_ID --body "$PROJECT_ID"
rm key.json   # ← 鍵はローカルに残さない（重要）
```

`.firebaserc` の `YOUR_FIREBASE_PROJECT_ID` も実際のIDに書き換えて commit しておく。

---

## 4. 動作確認

設定後、`main` に何か push すると **Actions → Deploy to Firebase Hosting** が走り、
`https://YOUR_FIREBASE_PROJECT_ID.web.app` に反映されます。

> シークレット `FIREBASE_SERVICE_ACCOUNT` と変数 `FIREBASE_PROJECT_ID` が未設定の間は、
> ワークフローのジョブは自動でスキップされます（赤いエラーにはなりません）。

---

## 独自ドメインを使う場合

Firebase コンソールの Hosting → 「カスタムドメインを追加」から設定できます（DNSにレコード追加が必要）。

## 補足: 他のGCPサービスを使う場合

- **Cloud Storage + Cloud CDN/ロードバランサ**: 大規模配信向け。HTTPS化にロードバランサ設定が必要でやや手間。
- **App Engine（standard・静的ハンドラ）/ Cloud Run**: 既に他のGCPサービスと統合したい場合の選択肢。
- 静的サイト単体なら **Firebase Hosting が最も手軽**でこのリポジトリではそれを前提にしています。
