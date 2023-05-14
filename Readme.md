# Wasm-Worker-Platform
シンプルなWasmコードの実行プラットフォーム

## 目的
ローカル環境でAWS Lambdaのように任意のシステム・アプリケーションをトリガに関数を実行できる環境を提供するプラットフォーム

## アーキテクチャ
* Rest API 起動
  * HTTPのPOSTリクエストでWASM機能にアクセスします
  * レスポンスもHTTPのJSONで返却します
  * HTTP通信に対応したアプリケーションとの連携をしやすくします
* Pathベース配置
  * WASMの配置パスとURLパスが対応するようにします
* WASMバイナリ配置
  * WASMバイナリを直接配置して利用することでWORKERの言語依存をなくします



## WASM要件
* exportする最初に実行される関数は handler
* 入力引数はJSON形式
* レスポンスはJSON形式で返す（予定）
