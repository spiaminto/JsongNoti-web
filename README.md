# 제이노티
## 0. 개요
### [서비스 바로가기](https://jsongnoti.com)

국내 노래방(TJ, 금영)에 등록되는 일본 신곡정보와 노래 검색 및 애창곡 저장 서비스를 제공하는 웹 서비스입니다.  
해당 노래방과 관련 없는 개인이 편의를 위해 만든 서비스 입니다.

## 1. 신곡 정보 및 알림메일
### 1.1 신곡 정보 확인
<img alt='신곡정보확인' src='https://github.com/user-attachments/assets/190d9810-ec9e-4c31-af56-591107a3b65d' width="80%">  

각 노래방에 등록되는 일본 신곡 정보를 확인할 수 있습니다.  
정보는 하루단위로 갱신되며 노래 제목 클릭을 통해 해당 곡 정보를 바로 구글 검색할 수 있습니다.  
신곡 정보는 지난달 까지 표시하며 그 이전의 곡들은 노래 검색을 통해 확인할 수 있습니다.

### 1.2 알림 메일
<img alt='구독하기' src='https://github.com/user-attachments/assets/b43f179f-ceb0-474a-a0de-40d14dde70f3' width="49%">
<img alt='알림메일' src='https://github.com/user-attachments/assets/3bc690bb-dea9-4cd1-b9c9-5be9bbcee875' width="49%">

이메일을 등록하면 신곡 정보 갱신시 신곡이 있을 경우 신곡의 정보를 메일로 받아보실 수 있습니다.  
메일 내에서도 노래 제목을 클릭하여 해당곡 정보를 바로 구글 검색할 수 있습니다.


## 2. 노래 검색

검색 하려는 노래방의 브랜드, 입력할 내용 (제목 또는 가수) 를 선택한 뒤 검색어를 입력하면 검색 결과를 확인할 수 있습니다.  

기본적으로 텍스트 유사도를 기준으로 검색하기 때문에 다소 부정확 하더라도 자세하게 입력하는것이 좋습니다.

검색을 위한 데이터를 GPT 로 생성하였기 떄문에 부정확한 결과를 지속적으로 수정중에 있습니다. 원하는 검색 결과가 나오지 않을시 문의 부탁드립니다.

### 2.1 아티스트 명 검색
<img alt='아티스트 검색-히게단' src='https://github.com/user-attachments/assets/36d998e8-83f4-4764-9d22-f51f392324fc' width="80%">  

원어 (영어, 일본어) 와 한국어 검색을 지원합니다.

<img alt='아티스트검색' src='https://github.com/user-attachments/assets/e5f4edab-2086-426f-bc2f-b717be1979d9' width="80%">  

대소문자를 구분하기 때문에 대문자만으로 이루어진 이름을 소문자로 검색하면 검색결과가 나오지 않습니다. 이때는 한글 발음 등으로 검색하는 걸 추천합니다.  
일부 아티스트에 한해 별명(줄임말) 검색이 가능합니다. 

 ### 2.2 제목 검색
<img alt='제목 검색' src='https://github.com/user-attachments/assets/1b0fa7a9-ad73-4f30-8fd1-0ba010297eb4' width="80%">  

원어 (영어, 일본어) 와 한국어 검색을 지원합니다.

대소문자를 구분하기 때문에 대문자만으로 이루어진 곡을 소문자로 검색하면 검색결과가 나오지 않습니다. 이때는 한글 발음 등으로 검색하는 걸 추천합니다.


## 3. 애창곡

브랜드 별로 애창곡을 저장하여 필요한 경우 바로 확인할 수 있습니다.  
해당 기능은 구글 로그인을 통해 사용 가능하며, 이전에 로그인 이력이 있을경우 다음부터 자동으로 로그인 됩니다.

### 3.1 추가
<img alt='애창곡 추가' src='https://github.com/user-attachments/assets/03e0c824-00c4-498e-8dd7-4030de08cfe3' width="80%">  

추가를 원하는 곡을 검색한뒤 검색 결과에서 해당 곡을 클릭하면 애창곡 추가 폼에 자동으로 정보가 입력됩니다.  
필요한 경우 추가 텍스트를 작성한 뒤 주가하기 버튼을 누르면 애창곡 목록에 추가됩니다.  
추가 순서 설정 버튼을 눌러 추가될 순서를 미리 지정할 수 있습니다.

### 3.2  순서 변경
<img alt='애창곡 순서 변경' src='https://github.com/user-attachments/assets/84cc2e2f-d4d0-4ad6-8abc-c48a76be3937' width="80%">  

애창곡 목록에서 각 곡이 표시될 순서를 변경할 수 있습니다.  
순서를 변경한 뒤 **순서 변경 완료 버튼을 눌러야 변경 사항이 적용됩니다.**  
해당 순서는 애창곡 설정의 표시방식이 **'순서대로' 인 경우에 적용**됩니다.

### 3.3 삭제
<img alt='애창곡 삭제' src='https://github.com/user-attachments/assets/7ea8c1c3-f6e2-42cd-abff-fecd149eda26' width="80%">  

애창곡 목록에서 곡을 삭제합니다.  
곡을 삭제하는 즉시 변경 사항이 적용됩니다.  
삭제가 모두 끝나면 삭제완료 버튼을 눌러 삭제를 끝냅니다.

### 3.4 설정

애창곡 목록에 관련된 설정입니다.

#### 3.4.1 표시 방식
<img alt='애창곡 표시 방식' src='https://github.com/user-attachments/assets/778bc6f1-f499-43b0-bb2b-38b137c7a38e' width="80%">
<img alt='애창곡 표시 방식 small' src='https://github.com/user-attachments/assets/bf7c92cc-2869-4009-b4dd-c192ff7ba425' width="80%">
<img alt='애창곡 표시 방식 400' src='https://github.com/user-attachments/assets/87764ed4-1cf8-4b53-bb74-462a95b27566' width="80%">


애창곡 목록의 표시 방식을 변경할수 있습니다.  

- 순서대로 : 저장된 순서로 표시합니다. **사용자가 순서를 변경했을경우 변경된 순서가 적용됩니다.**
- 아티스트별 : 아티스트명으로 묶어 알파벳 순으로 표시합니다. **사용자의 순서 변경이 적용되지 않습니다.**

#### 3.4.2 표시 브랜드
<img alt='애창곡 표시 브랜드' src='https://github.com/user-attachments/assets/a3d112af-e781-4d45-b70b-7597b2244b5e' width="80%">

애창곡 목록의 표시 브랜드를 변경할 수 있습니다.  
표시되지 않는 브랜드의 애창곡 목록은 보이지 않을뿐, 삭제되지 않습니다.

## 4. 편의기능
#### 4.1 다크모드
<img alt='다크모드' src='https://github.com/user-attachments/assets/fd344144-59ff-45b0-8a22-794472757cd5' width="80%">

노래방 등 어두운 상황에서 편리하게 사용할 수 있도록 다크모드를 활성화 할 수 있습니다.  
브라우저의 방문기록(캐시)을 삭제할 경우 다크모드가 비활성화 될 수 있습니다.