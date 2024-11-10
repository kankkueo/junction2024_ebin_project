FROM mcr.microsoft.com/dotnet/sdk:6.0

WORKDIR /app

# Install Git
RUN apt-get update && apt-get install -y git

# Clone the repository
RUN git clone https://github.com/xBimTeam/XbimExchange.git

WORKDIR /app/XbimExchange

# Restore NuGet packages
#RUN dotnet restore

# Build the project
RUN dotnet build Xbim.Exchange.sln -c Release

# Set the entrypoint (optional)
ENTRYPOINT ["dotnet", "/app/XbimExchange/Xbim.Convert.Console/bin/Release/net6.0/Xbim.Convert.Console.dll"]
