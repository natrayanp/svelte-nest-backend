module.exports = async (payload, helpers) => {
    const { name } = payload;
    helpers.logger.info(`i am inside Hello, ${name}`);
  };