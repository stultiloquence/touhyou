# touhyou

This is the model for client-server interaction right now:

```
<- { method: "options", options: [ "option1", "option2" ] }
-> { method: "vote", vote: "option1" }
<- { method: "vote count", count: 3 }
-> { method: "close poll" }
<- { method: "results", results: { "option1": 2, "option2": 5 } }
```