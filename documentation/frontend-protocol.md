| **Key**          | **Direction** | **Type**                      | **Usage**                                |
| ---------------- | ------------- | ----------------------------- | ---------------------------------------- |
| `playerName`     | Menu ↔ Game   | `string`                      | Player's nickname                        |
| `gameMode`       | Menu → Game   | `"FFA"` \| `"Death Match"`... | Selected game mode                       |
| `privateRoomId`  | Menu ↔ Game   | `"true"` \| Guid \| _absent_  | Teams mode only: new/private/common room |
| `customSkin`     | Menu → Game   | `string` (base64)             | Uploaded skin image                      |
| `availableSkins` | Game → Menu   | `string` (JSON-encoded list)  | Default skin list from server            |
| `lastScore`      | Game → Menu   | `number`                      | Final score for display                  |
