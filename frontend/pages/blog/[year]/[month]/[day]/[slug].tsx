import { useRouter } from 'next/router'
import { getNavData } from '../../../../../components/Nav'
import { getYearMonthDay } from '../../../../../utils/date'
import { Card, CardGroup } from '../../../../../components/Card'
import { Hero } from '../../../../../components/Hero'
import { StaticDetailPageOutProps, StaticDetailPageParams, StaticDetailPagePaths, StaticDetailPageProps } from '../../../../../types'
import NavPrevNextPost, { getPrevNextPost } from '../../../../../components/NavPrevNextPost'
import Places from '../../../../../components/Places'

function Post({ post, prevNextPosts }: StaticDetailPageProps) {
    const router = useRouter()
    const { year, month, day } = getYearMonthDay(post.attributes.publishedAt)

    if (router.isFallback) {
        return <div>Loading...</div>
    }

    return (
        <>
            <p className="t-6 t-bld limited-width">
                {`${day} ${month}  ${year} `}
            </p>
            {
                post.attributes.blocks.map((block: any, i: number) => {

                    const type = block['__component']

                    if (type === 'shared.card') {
                        return <Card key={i} {...block} />
                    } else if (type === 'block.hero') {
                        return <Hero key={i} data={block} />
                    } else if (type === 'block.card-group') {
                        return <CardGroup key={i} data={block} />
                    }
                })
            }

            {
                post.attributes.places &&
                <Places data={post.attributes.places.data}/>
            }


            <NavPrevNextPost posts={prevNextPosts} />
        </>
    )

}

export async function getStaticPaths(): Promise<StaticDetailPagePaths> {

    const res = await fetch(`${process.env.BASE_URL_STRAPI_API}/blog-posts`)
    const posts = await res.json()

    const paths = posts.data.map((item: any) => {

        const publishedAt = getYearMonthDay(item.attributes.publishedAt)

        return {
            params: {
                year: publishedAt.year,
                month: publishedAt.month,
                day: publishedAt.day,
                slug: `${item.attributes.slug}`,
            },
        }
    })

    return { paths, fallback: false }
}

// This also gets called at build time
export async function getStaticProps({ params }: StaticDetailPageParams): Promise<StaticDetailPageOutProps> {

    const res = await fetch(`${process.env.BASE_URL_STRAPI_API}/blog-posts?filters[slug]=${params.slug}&populate[0]=category&populate[1]=blocks.media.items&populate[2]=seo&populate[3]=pageTemplateSettings&populate[4]=blocks.cards,blocks.cards.media&populate=places,places.cover`)
    const post = await res.json()
    const postData = post.data[0]
    const categorySlug = postData.attributes.category.data.attributes.slug
    const seoData = postData.attributes.seo
    const navIndex = 3;
    const posts = await getNavData()
    const prevNextPosts = getPrevNextPost({ currentPostSlug: params.slug, categorySlug: categorySlug, posts: posts })

    return {
        props: {
            post: postData,
            posts: posts,
            seoData,
            navIndex,
            prevNextPosts
        }
    }
}

export default Post