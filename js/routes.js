//an array, defining the routes
export default [

    {
        //the part after '#' in the url (so-called fragment):
        hash: "welcome",
        ///id of the target html element:
        target: "router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate: (targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML

    },

    {
        hash: "articles",
        target: "router-view",
        getTemplate: fetchAndDisplayArticles
    },
    {
        hash:"commSend",
        target:"articles",
        getTemplate: addNewAComment
    },
    {
        hash: "article",
        target: "router-view",
        getTemplate: fetchAndDisplayArticleDetail
    },

    {
        hash: "artEdit",
        target: "router-view",
        getTemplate: editArticle
    },

    {
        hash: "artDelete",
        target: "router-view",
        getTemplate: deleteArticle
    },

    {
        hash: "opinions",
        target: "router-view",
        getTemplate: createHtml4opinions

    },

    {
        hash:"artInsert",
        target:"router-view",
        getTemplate: addArticle
    },


    {
        hash: "addOpinion",
        target: "router-view",
        getTemplate: (targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML
    }

];
const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 20;
let currentPage = 1;
let idForDelete = 0;
let totalArticleCount = 0;
fetchTotalCount();

function createHtml4opinions(targetElm) {
    const opinionsFromStorage = localStorage.myTreesComments;
    let opinions = [];

    if (opinionsFromStorage) {
        opinions = JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn = opinion.willReturn ? "Navstivim tuto stranku znova" : "Nie, uz nikdy nenavstivim stranku";
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-opinions").innerHTML,
        opinions
    );
}

function fetchTotalCount() {
    const url = "https://wt.kpi.fei.tuke.sk/api/article";

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })

        .then(tab => {
            totalArticleCount = tab.meta.totalCount;
            return Promise.resolve();
        })

        .catch(error => { ////here we process all the failed promises
            const errMsgObj = {errMessage: error};
            document.getElementById("router-view").innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });
}

function fetchAndDisplayArticles(targetElm, offsetFromHash, totalCountFromHash) {
    let articles =[];
    offsetFromHash=Number(offsetFromHash);
    totalCountFromHash=Number(totalCountFromHash);
    const data4rendering={
        currPage:offsetFromHash,
        pageCount:totalCountFromHash,
        articleList: articles
    };

    if(offsetFromHash>1){
        data4rendering.prevPage=offsetFromHash-1;
    }

    if(offsetFromHash<totalCountFromHash){
        data4rendering.nextPage=offsetFromHash+1;
    }

    let offset = data4rendering.currPage * 10;

    const url = "http://wt.kpi.fei.tuke.sk/api/article/?max=20&offset=" + offset;
    //const url = "http://wt.kpi.fei.tuke.sk/api/article/?max=10&offset=0";

    const articlesElm = document.getElementById("router-view");
    fetch(url)
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            addArtDetailLink2ResponseJson(responseJSON);
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles").innerHTML,
                    responseJSON
                );
            data4rendering.articleList=responseJSON.articles;
            return Promise.resolve();
        })
        .then( ()=> {

            let prrt;

            let cntRequests = data4rendering.articleList.map(
                article => fetch(`http://wt.kpi.fei.tuke.sk/api/article/${article.id}`)
            );
            return Promise.all(cntRequests);
        })
        .then(responses =>{
            let failed="";
            for(let response of responses) {
                if(!response.ok) failed+=response.url+" ";
            }
            if(failed===""){
                return responses;
            }else{
                return Promise.reject(new Error(`Failed to access the content of the articles with urls ${failed}.`));
            }
        })
        .then(responses => Promise.all(responses.map(resp => resp.json())))
        .then(articles => {
            articles.forEach((article,index) =>{
                data4rendering.articleList[index].content=article.content;
            });
            return Promise.resolve();
        })
        .then( () =>{

            renderArticles(data4rendering);


        })
        .catch (error => { ////here we process all the failed promises
            console.log(error);
        });

    function renderArticles(data) {
        articlesElm.innerHTML=Mustache.render(document.getElementById("template-articles").innerHTML, data ); //write some of the response object content to the page using Mustache
        //articlesElm.innerHTML = Mustache.render(document.getElementById("template-articles").innerHTML, data );
    }
}

function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments, true);
}

function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments, false);
}

function addArticle(targetElm) {
    let articleData = {
        submitBtTitle: "Save article",
        urlBase: urlBase,
        formSubmitCall: `processArtAddFrmData(event,'${urlBase}')`,
        formTitle: "Add article"
    };

    document.getElementById(targetElm).innerHTML =
        Mustache.render(
            document.getElementById("template-article-form").innerHTML,
            articleData
        );
    updateSignIn();
}

function deleteArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    const url = `${urlBase}/article/${artIdFromHash}`;


    fetch(url, {method: 'DELETE'})
        .then(response => {
            if (response.ok) {
                return response.json();

            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .catch(error => { ////here we process all the failed promises
            const errMsgObj = {errMessage: error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        })
        .finally(() => {
            window.location.href = `#articles/${offsetFromHash}/${totalCountFromHash}`;
        });

}

function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash, forEdit,) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else { //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {

            if (forEdit) {
                responseJSON.formTitle = "Article Edit";
                responseJSON.formSubmitCall =
                    `processArtEditFrmData(event,${artIdFromHash},${offsetFromHash / 10},${totalCountFromHash},'${urlBase}')`;
                responseJSON.submitBtTitle = "Save article";
                responseJSON.urlBase = urlBase;

                responseJSON.backLink = `#article/${artIdFromHash}/${offsetFromHash / 10}/${totalCountFromHash}`;


                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );

            } else {
                responseJSON.backLink = `#articles/${offsetFromHash / 10}/${totalCountFromHash}`;
                responseJSON.editLink = `#artEdit/${responseJSON.id}/${offsetFromHash / 10}/${totalCountFromHash}`;
                responseJSON.addCommLink=`#commSend/${responseJSON.id}`;
                responseJSON.deleteLink = `#artDelete/${responseJSON.id}/${offsetFromHash / 10}/${totalCountFromHash}`;


                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );
            }

        })
        .then( () => {
            return fetch(`${url}/comment`)
        })
        .then(response =>{
            if(response.ok){
                return response.json();
            }else{ //if we get server error
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .catch(error => { ////here we process all the failed promises
            const errMsgObj = {errMessage: error};
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        });

}

function addArtDetailLink2ResponseJson(responseJSON, offset, totalCount) {
    responseJSON.articles =
        responseJSON.articles.map(
            article => (
                {
                    ...article,
                    detailLink: `#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
                }
            )
        );
}

function addNewAComment(targetElm, artIdFromHash) {
    const newCommData = {
        text: document.getElementById("commentAdd").value.trim(),
        author: document.getElementById("commentAuthor").value.trim(),
    };

    if (!(newCommData.text && newCommData.author)) {
        window.alert("Please, enter article title and content");
        return;
    }
    const postReqSettings =
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
            },
            body: JSON.stringify(newCommData)
        };
    fetch(`${urlBase}/article/${artIdFromHash}/comment`, postReqSettings)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
            }
        })
        .then(responseJSON => {
            window.location.hash=`#article/${artIdFromHash}`;
        })
        .catch(error => {
            window.alert("Error adding comment to the server!");
            window.location.hash=`#article/${artIdFromHash}`;
        });
}

