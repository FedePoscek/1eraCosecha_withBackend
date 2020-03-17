'use strict'

var express = require('express');
var hbs = require('express-handlebars');
//variable de hbs
var nodemailer = require('nodemailer');
//mail creado expresamente para la clase
var mongoose = require('mongoose');
// instala el mongoDB

 
    
const app = express();

// Handlebars configuracion
app.engine('.hbs', hbs({extname: '.hbs'}));
//lo de arriba es para que lea .hbs, de base lee extension HANDLEBARS.
app.set('view engine', '.hbs');
// lo de arriba dice que el manejador de templates sea handlebars (hay otros)

app.use('/', express.static('web_cosecha'));
// Para poder usar formulario
app.use(express.urlencoded({extended: true})); //cuando el servidor recibe info la meta dentro de req.

//conecto con la base de datos
try {
    mongoose.connect('mongodb://localhost/mensaje', {useNewUrlParser: true, useUnifiedTopology: true});
console.log('conexion exitosa con la base de datos');
/* esto crea la base de datos y "mensaje" es el nombre de la base de datos.
{​useNewUrlParser: true​}); dice que lo que esta adelante contiene una URL */
}
catch(err) {
    console.log('Hubo errores en la conexion con la base de datos: ' + err);
}
/* este TRY and CATCH esta para establdecer la conexion con el servidor, si la conexion falla me devuelve el error. Puede fallar por conexion externa y lo pongo para que no me pinche el programa "proba de hacer todo y si falla hace esto que te digo" */


// Esquemas -> estructuras de la coleccion
const Schema = mongoose.Schema;
// con mayuscula y hace referencia al que esta mas abajo
// y arranco a crear la estructura de la "collection"
const schemas = {
    mensaje: new Schema({
        nombre: {type: String},
        mail: {type: String},
        telefono: {type: Number},
        comentarios: {type: String},
    },{collection: 'formularioCosecha'}) // aca iria una coma si tendria otra collection.
};

// Modelo -> abstraccion de los esquemas que vamos a utilizar para operar con la BD.
// siempre que debamos hacer operaciones (insertar, eliminar, actualizar, etc) sobre la BD.
// debemos utilizar modelos.
// los modelos son para NODEjs, objetos para que podamos trabajar
const models = {
    Mensaje: mongoose.model('mensaje', schemas.mensaje)
};
    // en mayuscula el nombre de la coleccion "Mensaje" y es para que lo entendamos como que viene de "mensaje".
    // ​Usuario:​ ​mongoose​.​model​(​'usuario'​, ​schemas​.​usuario​) ---> este no va xq seria otra coleccion.


app.get('/', function(req, res){
  res.render('formulario', {tipoFormulario: ''});
});
/* lo de arriba ---> como el formulario es hbs, esta intervenido por hbs, 
y esta dentro de Views.
."cuando la persona haga el formulario renderizame eñ formulario"
res.render('formulario'...) pide el formulario que ya sabe que es hbs.
.tipoFormulario coincide con "<p> {{ tipoFormulario }} </p>" del archivo formulario.hbs
que sera reemplazado por "Esto es el HBS".
*/

app.post('/', async function(req, res) {
  try {
      //TRY y CATCH es para errores que no puedo contemplar, predecibles y no predecibles  
      var error = [];
      /* creo un array para meter todas las variables de error adentro */
      if (!req.body.nombre || req.body.nombre && req.body.nombre == '') {
          //si no existe el campo nombre -o- existiendo el campo, me lo manda vacio
          error.push('El nombre es obligatorio');
      }
      if (!req.body.telefono || req.body.telefono && req.body.telefono == '') {
          error.push('El teléfono es obligatorio');
      }
      if (!req.body.mail || req.body.mail && req.body.mail == '') {
          error.push('El e-mail es obligatorio');
      }
      if (!req.body.comentarios || req.body.comentarios && req.body.comentarios == '') {
          error.push('Debes enviarme algún comentario!');
      }
      if (error.length > 0) {
          res.render('formulario', {error: error}) /* tengo una variable "error"-que viene del array- para que meta todos los error.push adentro. */
          return;
      }

        /* el TRY y CATCH sirve bien para el tema de mail que ya no dependen los errores de mi lado
        proba mandar el mail, si sale: ok, si no, no importa lo que sea, mandalo
        dentro de la variable err. para que no se corte la ejecucion del servidor 
        y no se joda todo el programa */
      var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: 'grupo2utnba',
              pass: 'utnba2019'
          }  //todo esto que viaja en un JSON -desde service hasta pass
      });

      // let info es otro tipo de variable que agarra la info de transporter y lo manda al sendmail
      // sendmail es el metodo que manda el mail
      // transport es la autenticacion y sendmail es el contenido.
      let info = await transporter.sendMail({
          from: '"'+req.body.nombre+' '+req.body.telefono+'" <'+req.body.mail+'>',
          to: 'grupo2utnba@gmail.com, '+req.body.mail,
          subject: 'Nuevo mensaje proveniente del sitio web',
          text: req.body.comentarios, //texto plano por si no reconoce rich
          html: '<p>'+req.body.comentarios+'</p>' //por si reconoce html
      });

      // si no llega a haber errores, manda esto:
      var result = null;
      var unMensaje = null;
      unMensaje = new models.Mensaje({
        nombre: req.body.nombre,
        telefono: req.body.telefono,
        mail: req.body.mail,
        comentarios: req.body.comentarios
      });

      result = await unMensaje.save(); 
      res.render('mensajeEnviado', {info: result.nombre, telefono: result.telefono, mail: result.mail, comentarios: result.comentarios });

      /* await: cuando estoy en mi maquina se cuanto tarda en responder, cuando lo mando a la red no, el await le dice que espere para este proceso pero que siga con el resto de los procesos mientras tanto, esto se llama "programacion asincronica". A nivel de todo, sigue corriendo pero se queda esperando esta respuesta y cuando llega la respuesta ejecuta la accion que tenia el await. (recordar ejemplo de la pizza, la pido y sigo laburando, no me quedo esperandola en la puerta. 
        El await para funcionar bien necesita que LA ESTRUCTURA SEA ASINCRONICA --- arriba esta puesto:
        app.post('/contacto', async function(req, res) {   ---   ese "async" es esto. */
  }
  catch(err) {
      res.render('formulario', {error: err});
  }
});
// el err es el que agarra el error

app.listen(3000, function(){
  console.log('Servidor escuchando en el puerto 3000');
});