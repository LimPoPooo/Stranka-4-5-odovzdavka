

let nazory=[];

if(localStorage.futbaloveKomenty){
    nazory=JSON.parse(localStorage.futbaloveKomenty);
}

console.log(nazory);
//-----------------------------------------------------------------


//let options = document.getElementById("opinions");

//mojFormular.addEventListener("submit",potvrdenieFormular);

function potvrdenieFormular(event){
    let mojFormular=document.getElementById("formular");
    event.preventDefault();

    const meno=mojFormular.elements[0].value;
    const email=mojFormular.elements[1].value;
    var hodnotenie;
    for (var i = 2; i < 4; i++) {
        if (mojFormular.elements[i].checked) {
            hodnotenie = mojFormular.elements[i].value;
            break;
        }
    }
    var odporucanie = 0;
    if (mojFormular.elements[5].checked) {
        odporucanie = 1;
    }
    const komentar=mojFormular.elements[6].value;
    const klucoveSlovo=mojFormular.elements[7].value;

    if(meno=="" || email=="" || komentar=="")
    {
        window.alert("Meno,Email a komentár nesmú byť prázdne ");
        return;
    }

    const novyNazor =
        {
            name: meno,
            mail: email,
            rating: hodnotenie,
            recommendation: odporucanie,
            comment: komentar,
            keyWord:klucoveSlovo,
            created: new Date().toLocaleString()
        };

    console.log("New opinion:\n "+JSON.stringify(novyNazor));

    nazory.push(novyNazor);

    localStorage.futbaloveKomenty = JSON.stringify(nazory);

    window.alert("Your opinion has been stored. Look to the console");
    console.log("New opinion added");
    console.log(nazory);

    window.location.hash="#opinions";
}










