using namespace System.Net

# Input bindings are passed in via param block.
param($Request, $TriggerMetadata)

# Associate values to output bindings by calling 'Push-OutputBinding'.
Push-OutputBinding -Name Response -Value ([HttpResponseContext]@{
    StatusCode = [HttpStatusCode]::OK
    Body = [Convert]::ToBase64String([System.Text.Encoding]::utf8.GetBytes($Request.Body.String))
})
