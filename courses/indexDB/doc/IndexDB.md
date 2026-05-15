# 📘 Hướng dẫn Toàn diện về IndexedDB: Từ A-Z

Chào mừng bạn đến với **Cẩm nang IndexedDB**! Tài liệu này sẽ đưa bạn từ một người mới bắt đầu trở thành chuyên gia về lưu trữ dữ liệu phía Client.

---

## 1. Mở đầu: Tại sao lại là IndexedDB? 🤔

Trong thế giới Web hiện đại, chúng ta không chỉ hiển thị thông tin mà còn chạy các ứng dụng phức tạp (PWA, Web App). Nhu cầu lưu trữ dữ liệu **LỚN** và **NHANH** ngay trên trình duyệt là bắt buộc.

### So sánh nhanh các công nghệ lưu trữ

| Đặc điểm            | IndexedDB 🗄️                       | LocalStorage 📦             | Cookies 🍪        |
| :------------------ | :--------------------------------- | :-------------------------- | :---------------- |
| 💾 **Dung lượng**   | **Rất lớn** (>Hundreds MB)         | **Nhỏ** (~5MB)              | **Rất nhỏ** (4KB) |
| 🔢 **Kiểu dữ liệu** | Object, Array, Blob, File, Date... | Chỉ String                  | Chỉ String        |
| ⚡ **Hiệu năng**    | **Async** (Không chặn UI)          | Sync (Chặn UI nếu data lớn) | Sync              |
| 🔍 **Tìm kiếm**     | Có Index (Tìm siêu nhanh)          | Duyệt tuần tự (Chậm)        | Không             |
| 💡 **Mục đích**     | App offline, data lớn, cache file  | Config, token, theme        | Auth, tracking    |

---

## 1.1. Ưu điểm và Nhược điểm (Pros & Cons) ⚖️

Mặc dù IndexedDB rất mạnh, nhưng không phải là "viên đạn bạc" cho mọi vấn đề.

### ✅ Ưu điểm (Pros)

1.  **Lưu trữ khổng lồ**: Thoải mái lưu hàng GB dữ liệu (phụ thuộc ổ cứng người dùng).
2.  **Hiệu năng cao**: Cơ chế bất đồng bộ (Async) giúp UI luôn mượt mà kể cả khi ghi đọc file nặng.
3.  **Hỗ trợ đa dạng**: Lưu được Blob, File, ArrayBuffer trực tiếp (không cần base64).
4.  **Transaction an toàn**: Đảm bảo toàn vẹn dữ liệu (ACID basics).
5.  **Offline-first**: Chìa khóa vàng cho các ứng dụng PWA hoạt động không cần mạng.

### ❌ Nhược điểm (Cons)

1.  **API phức tạp**: Code thuần (Vanilla JS) rất rắc rối, nhiều sự kiện (`onsuccess`, `onerror`).
2.  **Khó Debug**: DevTools hỗ trợ xem dữ liệu nhưng khó thao tác sửa/xóa nhanh như LocalStorage.
3.  **Tương thích**: Các trình duyệt rất cũ có thể hỗ trợ không đầy đủ (nhưng hiện tại >99% đã Ok).
4.  **Vấn đề Quota**: Nếu ổ cứng đầy, trình duyệt có thể tự xóa dữ liệu để giải phóng bộ nhớ (ít gặp nhưng có thể xảy ra).
5.  **Dữ liệu không được mã hóa**: IndexedDB lưu trữ dữ liệu dạng plaintext. Bất kỳ ai có quyền truy cập vào máy tính hoặc DevTools đều có thể đọc được dữ liệu. Không nên lưu thông tin nhạy cảm (mật khẩu, token, thông tin cá nhân quan trọng) mà không mã hóa trước.

---

## 2. Tư duy cốt lõi (Core Concepts) 🧠

Để làm chủ IndexedDB, bạn cần hiểu 5 khái niệm sau (tưởng tượng như một **Tủ hồ sơ**):

1.  **Database (Cơ sở dữ liệu)**:
    - Là cái **Tủ hồ sơ**. Mỗi ứng dụng có thể có nhiều tủ (Database), nhưng thường chỉ cần một.
    - _Đặc biệt_: Nó có **Version** (Phiên bản). Khi muốn thay đổi cấu trúc tủ (thêm ngăn), bạn phải tăng Version này lên.

2.  **Object Store (Kho chứa đối tượng)**:
    - Là các **Table (Bảng)** hoặc **Collection**.
    - Tương đương với **Table** trong SQL hoặc **Collection** trong MongoDB.
    - Nơi chứa dữ liệu thực tế (User, Product, Order...).

3.  **Index (Chỉ mục)**:
    - Là các **Nhãn dán** bên ngoài hồ sơ.
    - Giúp bạn tìm kiếm cực nhanh (Ví dụ: tìm theo _Email_ hoặc _Tuổi_) mà không cần lật từng hồ sơ một.

4.  **Transaction (Giao dịch)**:
    - Là quy tắc **"Làm xong hết hoặc không làm gì cả"**.
    - Mọi thao tác đọc/ghi đều phải nằm trong một Transaction. Nếu đang ghi mà lỗi -> Tự động hoàn tác (Rollback) như chưa có gì xảy ra. An toàn tuyệt đối!

5.  **Cursor (Con trỏ)**:
    - Là **"ngón tay"** duyệt qua từng hồ sơ một trong ngăn kéo.
    - Thay vì lấy hết 10,000 hồ sơ ra bàn (RAM), Cursor cho phép bạn đọc từng cái một, xử lý xong thì lấy tiếp.
    - Đặc biệt hữu ích khi dữ liệu quá lớn hoặc cần cập nhật/xóa hàng loạt.

---

## 3. Dữ liệu được lưu ở đâu trên máy? (Physical Location) 📂

IndexedDB không lưu trên "mây" (Cloud) mà lưu trực tiếp vào ổ cứng máy tính của người dùng (trong thư mục Profile của trình duyệt).

### 📍 Đường dẫn vật lý (Tham khảo)

Nếu bạn muốn mò vào tận nơi để xem file (dù nó được mã hóa/binary khó đọc), đây là địa chỉ thường gặp:

**Google Chrome / Edge (Windows):**

```bash
%LOCALAPPDATA%\Google\Chrome\User Data\Default\IndexedDB
# Hoặc Edge:
%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\IndexedDB
```

**Firefox (Windows):**

```bash
%APPDATA%\Mozilla\Firefox\Profiles\<profile-id>\storage\default
```

**macOS (Chrome):**

```bash
~/Library/Application Support/Google/Chrome/Default/IndexedDB
```

### 🛠️ Xem nhanh bằng DevTools (Khuyên dùng)

Thay vì mò vào folder, hãy dùng công cụ có sẵn của trình duyệt:

1.  Nhấn **F12** để mở DevTools.
2.  Chuyển sang tab **Application** (Chrome/Edge) hoặc **Storage** (Firefox).
3.  Chọn mục **IndexedDB** ở thanh bên trái.
4.  Tại đây bạn có thể xem, sửa, xóa dữ liệu trực quan như Excel.

---

## 4. Cách sử dụng (Vanilla JS - Code thuần không thư viện) 🍦

_Dành cho bạn nào muốn hiểu sâu hoặc không muốn phụ thuộc thư viện bên thứ 3._

Cơ chế của Vanilla JS dựa trên sự kiện (Event-based), khá giống `DOM events`.

### 4.1. Mở Database

```javascript
const request = indexedDB.open("MyDatabase", 1);

// Chạy 1 lần duy nhất khi tạo mới hoặc tăng version
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  if (!db.objectStoreNames.contains("users")) {
    db.createObjectStore("users", { keyPath: "id" });
  }
};

request.onsuccess = (event) => {
  console.log("Mở DB thành công!");
  const db = event.target.result;
};
```

### 4.2. Thêm dữ liệu (Transaction)

```javascript
const addData = (db, user) => {
  // 1. Tạo Transaction (ghi)
  const tx = db.transaction(["users"], "readwrite");
  const store = tx.objectStore("users");

  // 2. Thêm
  const req = store.add(user);

  req.onsuccess = () => console.log("Thêm thành công!");
  req.onerror = () => console.error("Lỗi:", req.error);
};
```

### 4.3. Lấy dữ liệu

```javascript
const getData = (db, id) => {
  const tx = db.transaction(["users"], "readonly");
  const store = tx.objectStore("users");

  const req = store.get(id);
  req.onsuccess = () => console.log("User:", req.result);
};
```

👉 **Nhận xét**: Bạn sẽ thấy code thuần khá dài dòng ("Callback Hell"). Đó là lý do ta nên dùng thư viện `idb` ở phần dưới.

---

## 5. Bắt đầu với thư viện `idb` 🛠️

Code thuần (Vanilla JS) của IndexedDB rất dài dòng (`onsuccess`, `onerror`). Chúng ta sẽ dùng thư viện **`idb`** (của Google) để code gọn gàng bằng `async/await`.

### 3.1. Cài đặt

```bash
npm install idb
```

### 3.2. Khởi tạo Database (Mở "Tủ hồ sơ")

```typescript
import { openDB, type DBSchema } from "idb";

// 1. Định nghĩa kiểu dữ liệu (TypeScript)
interface MyDB extends DBSchema {
  users: {
    key: string;
    value: { id: string; name: string; email: string; age: number };
    indexes: { "by-email": string; "by-age": number }; // Các nhãn dán
  };
}

// 2. Mở kết nối
const db = await openDB<MyDB>("my-database", 1, {
  upgrade(db) {
    // Hàm này CHỈ chạy khi tạo mới hoặc tăng version
    // Nơi duy nhất để tạo Object Store & Index

    // Tạo ngăn kéo 'users', dùng 'id' làm khóa chính
    const store = db.createObjectStore("users", { keyPath: "id" });

    // Dán nhãn (Tạo index) để tìm kiếm sau này
    store.createIndex("by-email", "email", { unique: true }); // Email không trùng
    store.createIndex("by-age", "age");
  },
});
```

---

## 4. Thao tác dữ liệu (CRUD) �

### Thêm dữ liệu (Create)

```typescript
await db.add("users", {
  id: "user-01",
  name: "Nguyen Van A",
  email: "a@example.com",
  age: 25,
});
```

### Đọc dữ liệu (Read)

```typescript
// Lấy theo ID (Key chính)
const user = await db.get("users", "user-01");

// Lấy TẤT CẢ
const allUsers = await db.getAll("users");
```

### Cập nhật (Update)

```typescript
// put: Nếu chưa có thì Thêm, có rồi thì Đè (Update)
await db.put("users", {
  id: "user-01",
  name: "Nguyen Van A (Updated)", // Tên mới
  email: "a@example.com",
  age: 26,
});
```

### Xóa (Delete)

```typescript
await db.delete("users", "user-01");
```

---

## 5. Sức mạnh tìm kiếm (Indexes & Range) 🚀

Đây là lý do chính ta chọn IndexedDB thay vì LocalStorage: **Khả năng tìm kiếm mạnh mẽ**.

### Tìm chính xác bằng Index

```typescript
// Tìm người có email là 'a@example.com'
// (Nhanh hơn rât nhiều so với lấy tất cả rồi filter)
const user = await db.getFromIndex("users", "by-email", "a@example.com");
```

### Tìm theo phạm vi (Range) - "Magic" của IDB 🎩

Bạn muốn tìm user từ 20 đến 30 tuổi?

```typescript
// IDBKeyRange.bound(lower, upper)
const range = IDBKeyRange.bound(20, 30);
const youngUsers = await db.getAllFromIndex("users", "by-age", range);
```

_Các loại Range khác:_

- `IDBKeyRange.lowerBound(20)`: Từ 20 tuổi trở lên.
- `IDBKeyRange.upperBound(50)`: Từ 50 tuổi trở xuống.
- `IDBKeyRange.only(25)`: Đúng 25 tuổi.

### 5.1. ⚠️ Giới hạn quan trọng của Index (Trade-offs)

Index trong IndexedDB sử dụng cấu trúc **B-Tree**, giống SQL. Điều này mang lại tốc độ cực nhanh nhưng cũng có **giới hạn quan trọng**:

| Loại tìm kiếm         | Index hỗ trợ? | Giải thích                                          |
| :-------------------- | :-----------: | :-------------------------------------------------- |
| **Exact Match** (=)   |      ✅       | Tìm `email = "a@example.com"` → Cực nhanh           |
| **Prefix** (Bắt đầu)  |      ✅       | Tìm tên bắt đầu bằng "Nguyen" → Dùng `IDBKeyRange`  |
| **Range** (Khoảng)    |      ✅       | Tìm tuổi từ 20-30 → Dùng `IDBKeyRange.bound()`      |
| **Contains** (Chứa)   |      ❌       | Tìm tên **chứa** "an" → **Index KHÔNG hỗ trợ!**     |
| **Suffix** (Kết thúc) |      ❌       | Tìm email kết thúc bằng "@gmail.com" → Không hỗ trợ |
| **Regex/Fuzzy**       |      ❌       | Tìm kiếm mờ (fuzzy) → Không hỗ trợ                  |

**💡 Ví dụ thực tế (Code trong Demo):**

```typescript
// ✅ INDEX CÓ THỂ LÀM (Siêu nhanh - O(log n))
// Tìm tên BẮT ĐẦU bằng "nguyen"
const range = IDBKeyRange.bound("nguyen", "nguyen" + "\uffff");
const results = await db.getAllFromIndex("users", "by-name", range);

// ❌ INDEX KHÔNG THỂ LÀM (Phải load hết rồi filter - O(n))
// Tìm tên CHỨA "an" ở giữa (như "Tran", "Hoang", "Lan"...)
const all = await db.getAll("users");
const filtered = all.filter((u) => u.name.includes("an"));
```

**🤔 Khi nào dùng cái gì?**

| Tình huống                            | Giải pháp                                                 |
| :------------------------------------ | :-------------------------------------------------------- |
| Data < 1,000 dòng                     | Dùng JS Filter (đơn giản, linh hoạt)                      |
| Data > 10,000 dòng + Tìm Prefix/Range | Dùng **Index** (bắt buộc để có hiệu năng)                 |
| Data lớn + Cần tìm kiếm "Contains"    | Lưu thêm trường `normalized` + Index hoặc dùng Web Worker |
| Full-text search phức tạp             | Cân nhắc thư viện như **Fuse.js** hoặc backend API        |

---

## 6. Cursor - Duyệt dữ liệu hiệu quả 🔄

**Cursor** là một "con trỏ" di chuyển qua từng record trong Object Store hoặc Index. Nó đặc biệt hữu ích khi:

- Dữ liệu quá lớn để load hết vào bộ nhớ (`getAll()` có thể gây crash).
- Cần xử lý từng dòng một (streaming).
- Muốn dừng sớm khi tìm thấy kết quả mong muốn.

### 6.1. Cursor là gì?

Tưởng tượng bạn có **100,000 hồ sơ** trong ngăn kéo. Thay vì đổ hết ra bàn (RAM), Cursor cho phép bạn:

1. Mở ngăn kéo
2. Lấy từng hồ sơ một
3. Xử lý xong thì lấy tiếp (hoặc dừng)

```
┌─────────────────────────────────────────┐
│           Object Store "users"          │
├─────────────────────────────────────────┤
│  [Record 1] ← Cursor bắt đầu ở đây      │
│  [Record 2]                             │
│  [Record 3] ← cursor.continue() → tiếp  │
│  [Record 4]                             │
│  [Record 5]                             │
│     ...                                 │
│  [Record N] ← Cursor kết thúc           │
└─────────────────────────────────────────┘
```

### 6.2. Sử dụng Cursor (Vanilla JS)

```javascript
const request = indexedDB.open("MyDatabase", 1);

request.onsuccess = (event) => {
  const db = event.target.result;
  const tx = db.transaction(["users"], "readonly");
  const store = tx.objectStore("users");

  // Mở cursor
  const cursorRequest = store.openCursor();

  cursorRequest.onsuccess = (e) => {
    const cursor = e.target.result;

    if (cursor) {
      console.log("Key:", cursor.key);
      console.log("Value:", cursor.value);

      // Di chuyển đến record tiếp theo
      cursor.continue();
    } else {
      console.log("Đã duyệt hết tất cả records!");
    }
  };
};
```

### 6.3. Sử dụng Cursor với thư viện `idb`

Thư viện `idb` cung cấp API đơn giản hơn với `iterate()`:

```typescript
// Duyệt tất cả users
const tx = db.transaction("users", "readonly");
const store = tx.objectStore("users");

let cursor = await store.openCursor();

while (cursor) {
  console.log("User:", cursor.value);

  // Xử lý logic ở đây...

  // Tiếp tục duyệt
  cursor = await cursor.continue();
}
```

### 6.4. Cursor với Index và Range

Cursor có thể kết hợp với **Index** và **IDBKeyRange** để duyệt có điều kiện:

```typescript
// Duyệt users từ 20-30 tuổi theo thứ tự tuổi
const tx = db.transaction("users", "readonly");
const index = tx.objectStore("users").index("by-age");
const range = IDBKeyRange.bound(20, 30);

let cursor = await index.openCursor(range);

while (cursor) {
  console.log(`${cursor.value.name} - ${cursor.value.age} tuổi`);
  cursor = await cursor.continue();
}
```

### 6.5. Cursor Direction (Hướng duyệt)

Cursor có thể duyệt theo nhiều hướng:

| Direction    | Mô tả                               |
| :----------- | :---------------------------------- |
| `next`       | Duyệt từ đầu đến cuối (mặc định)    |
| `prev`       | Duyệt từ cuối về đầu (đảo ngược)    |
| `nextunique` | Duyệt từ đầu, bỏ qua key trùng lặp  |
| `prevunique` | Duyệt từ cuối, bỏ qua key trùng lặp |

```typescript
// Duyệt ngược (từ cuối về đầu)
let cursor = await store.openCursor(null, "prev");

// Duyệt và bỏ qua các giá trị index trùng nhau
let cursor = await index.openCursor(null, "nextunique");
```

### 6.6. Cập nhật/Xóa với Cursor

Cursor còn cho phép **cập nhật** hoặc **xóa** record ngay tại vị trí hiện tại:

```typescript
const tx = db.transaction("users", "readwrite");
const store = tx.objectStore("users");

let cursor = await store.openCursor();

while (cursor) {
  const user = cursor.value;

  // Ví dụ: Tăng tuổi của tất cả users lên 1
  if (user.age < 100) {
    user.age += 1;
    await cursor.update(user); // Cập nhật tại chỗ
  }

  // Hoặc xóa users inactive
  if (user.status === "inactive") {
    await cursor.delete(); // Xóa record hiện tại
  }

  cursor = await cursor.continue();
}

await tx.done;
```

### 6.7. Pagination với Cursor (Phân trang)

Một use case phổ biến là **phân trang** dữ liệu lớn:

```typescript
/**
 * Lấy dữ liệu theo trang
 * @param page - Số trang (bắt đầu từ 1)
 * @param pageSize - Số record mỗi trang
 */
const getPage = async (page: number, pageSize: number) => {
  const tx = db.transaction("users", "readonly");
  const store = tx.objectStore("users");

  const results: User[] = [];
  const skip = (page - 1) * pageSize;
  let skipped = 0;

  let cursor = await store.openCursor();

  while (cursor && results.length < pageSize) {
    // Bỏ qua các record của trang trước
    if (skipped < skip) {
      skipped++;
      cursor = await cursor.continue();
      continue;
    }

    results.push(cursor.value);
    cursor = await cursor.continue();
  }

  return results;
};

// Sử dụng
const page1 = await getPage(1, 10); // 10 users đầu tiên
const page2 = await getPage(2, 10); // 10 users tiếp theo
```

### 6.8. So sánh `getAll()` vs `Cursor`

| Tiêu chí                 | `getAll()`                    | `Cursor`                           |
| :----------------------- | :---------------------------- | :--------------------------------- |
| **Bộ nhớ (RAM)**         | Load hết → Rủi ro cao nếu lớn | Load từng dòng → An toàn           |
| **Tốc độ khởi tạo**      | Chậm hơn (đợi load hết)       | Nhanh (bắt đầu ngay)               |
| **Dừng sớm**             | ❌ Không thể                  | ✅ Có thể (`break` bất cứ lúc nào) |
| **Cập nhật/Xóa tại chỗ** | ❌ Phải gọi riêng             | ✅ `cursor.update()` / `delete()`  |
| **Code đơn giản**        | ✅ Một dòng                   | ❌ Cần vòng lặp                    |
| **Phù hợp khi**          | Data nhỏ (< 1,000 records)    | Data lớn hoặc cần streaming        |

**💡 Quy tắc ngón tay cái:**

- Dưới 1,000 records → Dùng `getAll()` cho đơn giản
- Trên 10,000 records → **BẮT BUỘC** dùng Cursor
- Cần update/delete hàng loạt → Dùng Cursor

---

## 7. Best Practices & "Bẫy" thường gặp ⚠️

1.  **Đừng chặn UI**: Dù IndexedDB là Async, nhưng nếu bạn đọc/ghi 10,000 dòng một lúc mà không chia nhỏ (batching), browser vẫn có thể bị "khựng". Hãy dùng **Cursor** để duyệt từng dòng hoặc chia nhỏ tác vụ.
2.  **Quản lý Version cẩn thận**: Khi muốn thêm Index mới hay Store mới, BẮT BUỘC phải tăng version trong `openDB`. Nếu không, code `upgrade` sẽ không bao giờ chạy.
3.  **Lưu Blob/File trực tiếp**: Đừng convert ảnh sang Base64 (String) rồi lưu, nó làm tăng 30% dung lượng và chậm. Hãy lưu thẳng `Blob` vào IndexedDB.
4.  **Error Handling**: Luôn bọc code trong `try/catch`. Ổ cứng người dùng có thể bị đầy (QuotaExceededError).

---

## 8. Tổng kết

IndexedDB là "vũ khí bí mật" cho các ứng dụng Web hiệu năng cao. Nó hơi khó lúc đầu, nhưng khi đã hiểu tư duy **Database - Store - Index**, bạn sẽ thấy nó cực kỳ mạnh mẽ.

👉 **Muốn xem code chạy thật?**
Hãy mở tab **Demo** trên menu để xem ứng dụng quản lý User và Cache ảnh thực tế nhé!
