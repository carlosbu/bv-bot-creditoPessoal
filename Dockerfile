FROM registry.ng.bluemix.net/ibmnode

	ADD ./app /credito-pessoal-api
	ADD ./node_modules /node_modules
	ADD ./views /views

	ENV NODE_ENV production

	EXPOSE 3000

	CMD ["node", "/credito-pessoal-api/app.js"]
