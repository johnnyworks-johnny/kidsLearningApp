#!/usr/bin/env bash
# ============================================================
# ひらがなアプリ専用 Firebase プロジェクトのセットアップ
#
# 事前準備（対話ログインが必要なため、先に手動で実行してください）:
#   gcloud auth login          # ← johnny.fung@johnnyworks.jp でログイン
#   gh auth status             # ← GitHub にログイン済みか確認
#
# 使い方（このリポジトリのルートで実行）:
#   bash scripts/setup-firebase.sh
#
# このスクリプトがやること:
#   1. GCPプロジェクト作成
#   2. 必要なAPIを有効化
#   3. プロジェクトをFirebase化
#   4. Hostingサイトを作成
#   5. デプロイ用サービスアカウントと鍵を作成
#   6. GitHubのSecret/変数に登録
#   7. .firebaserc を更新
# ※ 実デプロイ（本番反映）はしません。最後に git push した時点で
#    GitHub Actions が初回デプロイします（本番反映は人の操作で行う）。
# ============================================================
set -euo pipefail

# ---- 設定（必要なら変更）----
PROJECT_ID="hiragana-kids-app"
PROJECT_NAME="hiragana-kids-app"
SA_NAME="github-hosting-deployer"
REGION_NOTE="Hostingはグローバルなのでリージョン指定は不要"

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "==> 認証アカウント: $(gcloud config get-value account 2>/dev/null)"
echo "==> 作成するプロジェクトID: ${PROJECT_ID}"
echo ""

# ------------------------------------------------------------
# 1. プロジェクト作成（すでにあればスキップ）
# ------------------------------------------------------------
if gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "[1/7] プロジェクト ${PROJECT_ID} は既に存在します。スキップ。"
else
  echo "[1/7] プロジェクトを作成します..."
  gcloud projects create "${PROJECT_ID}" --name="${PROJECT_NAME}"
fi

# ------------------------------------------------------------
# 2. 必要なAPIを有効化
# ------------------------------------------------------------
echo "[2/7] APIを有効化します（数十秒かかることがあります）..."
gcloud services enable \
  firebase.googleapis.com \
  firebasehosting.googleapis.com \
  --project "${PROJECT_ID}"

TOKEN="$(gcloud auth print-access-token)"

# REST APIのオペレーション完了を待つ小さなヘルパー
wait_operation () {
  local op_url="$1"
  for _ in $(seq 1 30); do
    local done
    done="$(curl -s -H "Authorization: Bearer ${TOKEN}" "${op_url}" | grep -o '"done": *true' || true)"
    [ -n "${done}" ] && return 0
    sleep 3
    TOKEN="$(gcloud auth print-access-token)"  # トークンを更新
  done
  echo "   （オペレーションの完了確認がタイムアウト。コンソールで状態を確認してください）"
}

# ------------------------------------------------------------
# 3. プロジェクトをFirebase化（すでにFirebaseならスキップ）
# ------------------------------------------------------------
echo "[3/7] プロジェクトをFirebase化します..."
if curl -s -H "Authorization: Bearer ${TOKEN}" \
     "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}" \
     | grep -q '"projectId"'; then
  echo "   既にFirebaseプロジェクトです。スキップ。"
else
  OP="$(curl -s -X POST \
     -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
     "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}:addFirebase" \
     | grep -o '"name": *"[^"]*"' | head -1 | cut -d'"' -f4)"
  if [ -n "${OP:-}" ]; then
    wait_operation "https://firebase.googleapis.com/v1/${OP}"
  fi
  echo "   Firebase化が完了しました。"
fi

# ------------------------------------------------------------
# 4. Hostingサイトを作成（すでにあればスキップ）
# ------------------------------------------------------------
echo "[4/7] Hostingサイトを作成します（サイトID: ${PROJECT_ID}）..."
TOKEN="$(gcloud auth print-access-token)"
if curl -s -H "Authorization: Bearer ${TOKEN}" \
     "https://firebasehosting.googleapis.com/v1beta1/projects/${PROJECT_ID}/sites/${PROJECT_ID}" \
     | grep -q '"name"'; then
  echo "   サイトは既に存在します。スキップ。"
else
  curl -s -X POST \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/${PROJECT_ID}/sites?siteId=${PROJECT_ID}" \
    -d '{}' >/dev/null
  echo "   サイトを作成しました。"
fi

# ------------------------------------------------------------
# 5. デプロイ用サービスアカウントと鍵を作成
# ------------------------------------------------------------
echo "[5/7] デプロイ用サービスアカウントを準備します..."
if ! gcloud iam service-accounts describe "${SA_EMAIL}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="GitHub Actions Hosting Deployer" --project "${PROJECT_ID}"
fi
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/firebasehosting.admin" --condition=None >/dev/null
echo "   サービスアカウント: ${SA_EMAIL}"

echo "   鍵を発行します..."
TMP_KEY="$(mktemp)"
gcloud iam service-accounts keys create "${TMP_KEY}" \
  --iam-account="${SA_EMAIL}" --project "${PROJECT_ID}"

# ------------------------------------------------------------
# 6. GitHubのSecret/変数に登録
# ------------------------------------------------------------
echo "[6/7] GitHubにSecret/変数を登録します..."
gh secret   set FIREBASE_SERVICE_ACCOUNT < "${TMP_KEY}"
gh variable set FIREBASE_PROJECT_ID --body "${PROJECT_ID}"
rm -f "${TMP_KEY}"   # 鍵はローカルに残さない
echo "   Secret: FIREBASE_SERVICE_ACCOUNT / 変数: FIREBASE_PROJECT_ID を登録しました。"

# ------------------------------------------------------------
# 7. .firebaserc を更新
# ------------------------------------------------------------
echo "[7/7] .firebaserc を更新します..."
cat > .firebaserc <<EOF
{
  "projects": {
    "default": "${PROJECT_ID}"
  }
}
EOF

echo ""
echo "============================================================"
echo "✅ セットアップ完了！"
echo ""
echo "次のステップ（初回デプロイ＝本番反映は人の操作で）:"
echo "  git add .firebaserc"
echo "  git commit -m \"Firebaseプロジェクト ${PROJECT_ID} を設定\""
echo "  git push origin main      # ← これで GitHub Actions が初回デプロイします"
echo ""
echo "公開URL（デプロイ後）: https://${PROJECT_ID}.web.app"
echo "============================================================"
