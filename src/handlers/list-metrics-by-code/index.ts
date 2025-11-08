export const handler = async (event: any) => {
  console.log("[ListMetricsByCode] Handler invoked", {
    event: JSON.stringify(event, null, 2),
  });

  console.log("[ListMetricsByCode] Handler completed (not yet implemented)");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello, world!" }),
  };
};
