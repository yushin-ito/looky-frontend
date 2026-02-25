import { useCursorInfiniteScrollQuery } from "@supabase-cache-helpers/postgrest-swr";
import { useFileUrl } from "@supabase-cache-helpers/storage-swr";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, TouchableOpacity, useWindowDimensions } from "react-native";
import { H1, Spinner, Text, View, XStack, YStack } from "tamagui";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { categories } from "@/constants";
import { supabase } from "@/lib/client";
import { useSessionStore } from "@/stores/useSessionStore";
import type { Category } from "@/types";

interface ClothesItemProps {
  id: number;
}

const ClothesItem = memo(({ id }: ClothesItemProps) => {
  const { data: url, isLoading } = useFileUrl(
    supabase.storage.from("clothes"),
    `${id}.png`,
    "public",
    {
      ensureExistence: true,
    },
  );

  if (isLoading) {
    return (
      <Skeleton w="100%" aspectRatio={3 / 4} rounded="$2xl" boxShadow="$sm" />
    );
  }

  return (
    <Link
      href={{
        pathname: "/details/[id]",
        params: { id },
      }}
      asChild
    >
      <TouchableOpacity activeOpacity={0.6}>
        <View
          w="100%"
          aspectRatio={3 / 4}
          rounded="$2xl"
          boxShadow="$sm"
          overflow="hidden"
          bg="$mutedBackground"
        >
          <Image
            style={{
              width: "100%",
              height: "100%",
            }}
            source={url}
            transition={200}
          />
        </View>
      </TouchableOpacity>
    </Link>
  );
});

const ClothesPage = memo(() => {
  const { t } = useTranslation(["common", "collections"]);
  const { width } = useWindowDimensions();
  const session = useSessionStore((state) => state.session);
  const [category, setCategory] = useState<Category>("tops");

  const { data, loadMore, isLoading, isValidating } =
    useCursorInfiniteScrollQuery(
      () =>
        supabase
          .from("t_like")
          .select(`
          id,
          clothes:t_clothes!inner (id)
        `)
          .eq("user_id", session?.user.id ?? "")
          .eq("t_clothes.category", category)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .limit(12),
      {
        orderBy: "id",
        uqOrderBy: "id",
      },
    );

  const isRefreshing = !isLoading && isValidating;

  return (
    <YStack flex={1} pt="$6" gap="$4">
      <YStack gap="$4" px="$8">
        <XStack gap="$2">
          {categories.map((item, index) => (
            <Button
              key={index.toString()}
              variant={category === item ? "primary" : "outline"}
              h="auto"
              px="$3"
              py="$2"
              rounded="$full"
              boxShadow="none"
              onPress={() => setCategory(item)}
            >
              <Button.Text fontSize="$sm">
                {t(`common:category.${item}`)}
              </Button.Text>
            </Button>
          ))}
        </XStack>
      </YStack>
      {isLoading ? (
        <FlatList
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 8,
          }}
          columnWrapperStyle={{ gap: 16 }}
          data={Array.from({ length: 6 })}
          renderItem={() => (
            <View flex={1} mb="$4">
              <Skeleton
                w="100%"
                aspectRatio={3 / 4}
                rounded="$2xl"
                boxShadow="$sm"
              />
            </View>
          )}
        />
      ) : (
        <FlatList
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 8,
          }}
          columnWrapperStyle={{ gap: 16 }}
          data={data}
          onEndReached={loadMore}
          ListFooterComponent={() =>
            isRefreshing && (
              <View pt="$4" justify="center">
                <Spinner color="$mutedColor" />
              </View>
            )
          }
          ListEmptyComponent={() => (
            <YStack flex={1} pt="$20" items="center" gap="$6">
              <View w={200} h={200} rounded="$full" bg="$mutedBackground">
                <Image
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  source={require("../../../../assets/images/empty.png")}
                  transition={200}
                />
              </View>
              <YStack items="center" gap="$4">
                <H1 fontWeight="$bold" fontSize="$xl">
                  {t("collections:clothes.empty.title")}
                </H1>
                <Text
                  text="center"
                  fontSize="$sm"
                  lineHeight="$sm"
                  color="$mutedColor"
                >
                  {t("collections:clothes.empty.description")}
                </Text>
              </YStack>
            </YStack>
          )}
          renderItem={({ item }) => (
            <View w={(width - 24 * 2 - 16) / 2} mb="$4">
              <ClothesItem id={item.clothes?.id} />
            </View>
          )}
        />
      )}
    </YStack>
  );
});

export default ClothesPage;
