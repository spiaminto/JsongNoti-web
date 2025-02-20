# 제이노티
## 0. 개요
### [서비스 바로가기](https://jsongnoti.com)

국내 노래방(TJ, 금영)에 등록되는 일본 신곡정보와 노래 검색 및 애창곡 저장 서비스를 제공하는 웹 서비스입니다.  
해당 노래방과 관련 없는 개인이 편의를 위해 만든 서비스 입니다.

### 0.1 서비스 아키텍처
<img alt='아키텍처' src='https://github.com/user-attachments/assets/8cfca7dc-2f88-4dcb-ae35-2df9e68347fa' width="80%">

* __CloudFlare:__ DNS 및 TLS 인증서 적용, 봇 차단 등을 담당합니다.
* __Elastic Beanstalk:__ EC2 와 RDS, CloudWatch 등 여러가지 AWS 서비스를 통합 관리합니다.
* __RDS:__ 검색 인덱스와 유사도 검색을 위해 PostgreSQL 데이터베이스를 사용합니다. pg_bigm 을 통해 GIN index 인덱싱과 유사도 검색을 구현합니다.  
* __Lambda:__ EventBridge 의 스케쥴에 맞추어 람다 함수를 실행합니다. 람다함수는 SpringCloudFunction 으로 구현하였으며, 각 노래방 서비스에서 신곡 정보를 수집하고, GPT 를 통해 한글화 데이터를 생성하여 데이터베이스에 저장합니다.  



## 1. 신곡 정보 및 알림메일
### 1.1 신곡 정보 확인
<img alt='신곡정보확인' src='https://github.com/user-attachments/assets/db848e38-c98a-406e-a7c6-ecf5058ab50b' width="80%">  

각 노래방에 등록되는 일본 신곡 정보를 확인할 수 있습니다.  
정보는 하루단위로 갱신되며 노래 제목 클릭을 통해 해당 곡 정보를 바로 구글 검색할 수 있습니다.  
신곡 정보는 지난달 까지 표시하며 그 이전의 곡들은 노래 검색을 통해 확인할 수 있습니다.

### 1.2 알림 메일
<img alt='구독하기' src='https://github.com/user-attachments/assets/7afebcd9-1af2-4f53-b9d6-57f0af0edd44' width="40%">
<img alt='알림메일' src='https://github.com/user-attachments/assets/3bc690bb-dea9-4cd1-b9c9-5be9bbcee875' width="40%">

이메일을 등록하면 신곡 정보 갱신시 신곡이 있을 경우 신곡의 정보를 메일로 받아보실 수 있습니다.  
메일 내에서도 노래 제목을 클릭하여 해당곡 정보를 바로 구글 검색할 수 있습니다.


## 2. 노래 검색

검색 하려는 노래방의 브랜드, 입력할 내용 (제목 또는 가수) 를 선택한 뒤 검색어를 입력하면 검색 결과를 확인할 수 있습니다.  

기본적으로 텍스트 유사도를 기준으로 검색하기 때문에 다소 부정확 하더라도 대상의 이름(제목) 전체를 입력하는것을 추천합니다.

검색을 위한 데이터를 GPT 로 생성하였기 떄문에 부정확한 결과를 지속적으로 수정중에 있습니다. 원하는 검색 결과가 나오지 않을시 서비스 페이지 아래의 문의 부탁드립니다.

### 2.1 아티스트 명 검색
<img alt='아티스트 검색-히게단' src='https://github.com/user-attachments/assets/85206a4b-930b-4fed-a93b-f12216cabcdc' width="80%">  

원어 (영어, 일본어) 와 한국어 (번역명, 발음) 검색을 지원합니다.    
검색 대상의 일부만 입력할 경우 검색되지 않을 수 있습니다.  
> [!TIP]  
><b>검색 가능 예시 : </b> Official髭男dism, officialhigedandism, 오피셜 히게 단디즘, 오피셜 히게, 히게단    
<b>검색 불가능 예시 : </b> 髭男, 오피셜, 단디즘

<img alt='아티스트검색' src='https://github.com/user-attachments/assets/29dbc079-4094-4511-b5cd-d4e748539eec' width="80%">  

대소문자를 구분하기 때문에 대문자만으로 이루어진 이름을 소문자로 검색하면 검색결과가 나오지 않습니다. 이때는 한글 발음 등으로 검색하는 걸 추천합니다.  
> [!TIP]  
><b>검색 가능 예시 : </b> RADWIMPS, 래드윔프스, 랏도  
<b>검색 불가능 예시 : </b> radwimps  
<b>검색 정확도 낮은 예시(피처링 결과가 제외됨) : </b>RADWIMP, 레드윔프스


일부 아티스트에 한해 별명(줄임말) 검색이 가능합니다. 수기로 입력된 데이터이기 때문에 정확도가 높습니다.    
특정 아티스트의 수기 입력 또는 검색 결과 개선 문의는 서비스 페이지 아래의 Contact 를 통해 부탁드립니다.  


 ### 2.2 제목 검색
<img alt='제목 검색' src='https://github.com/user-attachments/assets/98e5dd80-216d-45ba-8236-d31f0e2fcc07' width="80%">  

원어 (영어, 일본어) 와 한국어 (번역명, 발음) 검색을 지원합니다.    
검색 대상의 일부만 입력할 경우 검색되지 않을 수 있습니다.  
> [!TIP]  
> <b>검색 가능 예시 : </b> さよーならまたいつか！, 안녕 또 언젠가, 잘가 언젠가, 사요나라 마타 이츠카, 사요나라 마타  
<b>검색 불가능 예시 : </b> さよーなら, 안녕, 사요나라, 이츠카


대소문자를 구분하기 때문에 대문자만으로 이루어진 곡을 소문자로 검색하면 검색결과가 나오지 않습니다. 이때는 한글 발음 등으로 검색하는 걸 추천합니다.  
>[!TIP]  
><b>검색 가능 예시 : </b> KICK BACK, 킥 백  
<b>검색 불가능 예시 : </b> kick back

## 3. 애창곡

브랜드 별로 애창곡을 저장하여 필요한 경우 바로 확인할 수 있습니다.  
해당 기능은 구글 로그인을 통해 사용 가능하며, 이전에 로그인 이력이 있을경우 다음부터 자동으로 로그인 됩니다.

### 3.1 추가
<img alt='애창곡 추가' src='https://github.com/user-attachments/assets/3121cfdb-9486-4b79-9234-29b8c7b4183b' width="80%">  

추가를 원하는 곡을 검색한뒤 검색 결과에서 해당 곡을 클릭하면 애창곡 추가 폼에 자동으로 정보가 입력됩니다.  
필요한 경우 추가 텍스트를 작성한 뒤 주가하기 버튼을 누르면 애창곡 목록에 추가됩니다.  
추가 순서 설정 버튼을 눌러 추가될 순서를 미리 지정할 수 있습니다.

### 3.2  순서 변경
<img alt='애창곡 순서 변경' src='https://github.com/user-attachments/assets/3c02a078-9803-4d33-9e21-e95b8a5935ac' width="80%">  

애창곡 목록에서 각 곡이 표시될 순서를 변경할 수 있습니다.  
순서를 변경한 뒤 **순서 변경 완료 버튼을 눌러야 변경 사항이 적용**됩니다.  
> [!WARNING]  
> 사용자가 변경한 순서는 애창곡 설정의 표시 방식이 '순서대로' 일때 적용됩니다.

### 3.3 삭제
<img alt='애창곡 삭제' src='https://github.com/user-attachments/assets/14c570cb-078d-4de5-b38d-4a4c8248ea86' width="80%">  

애창곡 목록에서 곡을 삭제합니다.  
곡을 **삭제하는 즉시 변경 사항이 적용**됩니다.  
삭제가 모두 끝나면 삭제완료 버튼을 눌러 삭제를 끝냅니다.

### 3.4 설정

애창곡 목록에 관련된 설정입니다.

#### 3.4.1 표시 방식
<img alt='애창곡 표시 방식 small' src='https://github.com/user-attachments/assets/bf7c92cc-2869-4009-b4dd-c192ff7ba425' width="80%">

애창곡 목록의 표시 방식을 변경할수 있습니다.  

- 순서대로 : 저장된 순서로 표시합니다. 사용자가 변경한 순서가 적용됩니다. 
- 아티스트별 : 아티스트명으로 묶어 알파벳 순으로 표시합니다.

#### 3.4.2 표시 브랜드
<img alt='애창곡 표시 브랜드' src='https://github.com/user-attachments/assets/3416d37b-b26c-48db-b24f-f6661d14a853' width="80%">

애창곡 목록의 표시 브랜드를 변경할 수 있습니다.  
표시되지 않는 브랜드의 애창곡 목록은 보이지 않을뿐, 삭제되지 않습니다.

## 4. 편의기능
#### 4.1 다크모드
<img alt='다크모드' src='https://github.com/user-attachments/assets/669958cb-01b1-493f-9188-35b44db1d486' width="80%">

노래방 등 어두운 상황에서 편리하게 사용할 수 있도록 다크모드를 활성화 할 수 있습니다.  
브라우저의 방문기록(캐시)을 삭제할 경우 다크모드 설정값이 초기화 될 수 있습니다.