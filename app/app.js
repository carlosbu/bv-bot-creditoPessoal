var express = require("express");
var app = express();
var cfenv = require("cfenv");
var request = require('request');
var bodyParser = require('body-parser')

// Dados para acesso a API de autenticação
const tokenConfig = { useBasicAuthorizationHeader :false};
const credentials = {
  client: {
    id: 'l7xxfc4f9c94167346c784675b1c35a55c15',
    secret: '339673f4f3084d2fb693217edec5931f'
  },
  auth: {
    tokenHost: 'https://api-des.bancovotorantim.com.br',
    tokenPath :'/auth/oauth/v2/token'
  }
};

// Initialize the OAuth2 Library
const oauth2 = require('simple-oauth2').create(credentials);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//Simulador de credito pessoal que retorna valores fixos, para acelerar o desenvolvimento
app.get('/bv/api/v0/creditoPessoal/values', function (req, res) {
  var json = {
    "simulacao": {
      "coeficiente": "0.05359" ,
      "valorParcelas": "535.9"
    },
  }
  res.send(json);
});


//Versão do simulador de credito pessoal que retorna os valores pra valer
app.get('/bv/api/v1/creditoPessoal/values', function (req, res) {

  oAuthBV(callCreditoPessoal)

    function oAuthBV (callback) {
      oauth2.clientCredentials.getToken(tokenConfig)
      .then((result) => {
        const tokenBV = oauth2.accessToken.create(result);
        console.log('Valor do tokenBV -->', tokenBV.token.access_token);
        callback(tokenBV)
      })
      .catch((error) => {
        console.log('Access Token Error', error.message);
      });
    }

    function callCreditoPessoal (tokenBV) {
      var parcelas = req.query.parcelas;
      var carencia =  req.query.carencia;
      // valores fixos fornecidos durante a PoC
      var messageData = {
        "codigoParceiroComercial": "28920",
        "tipoPessoa": "F",
        "codigoTabelaFinanciamento": "00I",
        "codigoModalidade": "16",
        "indicadorPosFixado": "false",
        "valorTaxaRetornoFinanciamento": "0",
        "prazoFinanciamento": parcelas,
        "quantidadeDiasCarencia": carencia
      }
      var options = {
          url: 'https://api-des.bancovotorantim.com.br/v1/varejo/tarifacao/credito-pessoal/condicoes-sem-garantia',
          qs: { access_token: tokenBV.token.access_token },
          method: 'POST',
          json: messageData
      }
      request(options, simularFinanciamento)
    }

  function simularFinanciamento(error, response, body) {
    if (!error && response.statusCode == 200) {
      if (body.listaDadosCoeficientesSimulacaoFinanciamento){
        console.log();
        var coeficiente = body.listaDadosCoeficientesSimulacaoFinanciamento[0].listaCoeficientesSimulacaoFinanciamento[0].coeficiente;
        console.log(coeficiente)
        var valor =  req.query.valor;
        var valorParcelas = parseFloat(coeficiente) * parseFloat(valor);
        console.log(valorParcelas);
      }else{
        console.log("simulador indisponivel. tente mais tarde.");
      }
      var json = {
        "simulacao": {
          "coeficiente": coeficiente ,
          "valorParcelas": valorParcelas
        },
      }
      res.send(json);
    }
    }
  });

var port = process.env.PORT || 3000
app.listen(port, function() {
console.log("To view your app, open this link in your browser: http://localhost:" + port);
});
